import { gsap } from '../core/gsap.js';
import { createScope } from '../core/lifecycle.js';
import { createPixelCells } from '../utils/pixels.js';

const STORAGE_KEY = 'frame:page-transition';
const COVER_DURATION = 0.65;
const OPEN_DURATION = 0.75;
// CSS tile-reveal currently owns navigation; retain the disabled canvas link behavior.
const CANVAS_LINK_TRANSITIONS_ENABLED = false;

/** Only ordinary same-origin document links participate. */
export function getPageTransitionUrl(anchor, event, currentHref) {
    if (
        !anchor ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        anchor.hasAttribute('download') ||
        anchor.hasAttribute('data-no-transition') ||
        anchor.hasAttribute('data-open-popup') ||
        (anchor.getAttribute('target') &&
            anchor.getAttribute('target').toLowerCase() !== '_self') ||
        anchor.relList?.contains('external')
    )
        return null;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return null;
    const current = new URL(currentHref);
    let url;
    try {
        url = new URL(href, current);
    } catch {
        return null;
    }
    if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.origin !== current.origin ||
        (url.pathname === current.pathname && url.search === current.search) ||
        /\/(?:wp-admin(?:\/|$)|wp-login\.php)/i.test(url.pathname) ||
        /\.(?:pdf|zip|gz|rar|7z|jpe?g|png|webp|svg|gif|mp[34]|webm|docx?|xlsx?|csv)$/i.test(
            url.pathname,
        )
    )
        return null;
    return url.href;
}

/** One removable module owns the canvas, navigation interception and entrance handoff. */
export function initPageTransition(root) {
    const view = root.defaultView;
    const bridge = view.framePageTransition;
    if (!bridge?.enabled) return;
    const scope = createScope();
    const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
    const state = { progress: bridge.pending ? 1 : 0 };
    let canvas = bridge.cover;
    let context;
    let cells = [];
    let tween;
    let handoff;
    let openTimer;
    let recoveryTimer;
    let destination;
    let navigating = false;
    let disposed = false;
    let opening = false;

    const release = () => {
        if (bridge.pending) bridge.release();
    };
    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#fff';
        for (const cell of cells) {
            if (state.progress >= cell.threshold) {
                context.fillRect(cell.x, cell.y, cell.width, cell.height);
            }
        }
    }
    function resize() {
        if (!canvas || !context) return;
        const width = view.innerWidth;
        const height = view.innerHeight;
        const size = width <= 767 ? 40 : width <= 1280 ? 80 : 100;
        const columns = Math.ceil(width / size);
        const pixel = width / columns;
        const rows = Math.ceil(height / pixel);
        const ratio = Math.min(view.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        cells = createPixelCells(columns, rows, 'down').map((cell) => {
            const x = Math.round(cell.column * pixel * ratio);
            const y = Math.round(cell.row * pixel * ratio);
            return {
                ...cell,
                x,
                y,
                width: Math.round((cell.column + 1) * pixel * ratio) - x,
                height: Math.round((cell.row + 1) * pixel * ratio) - y,
            };
        });
        draw();
    }
    function prepare() {
        if (!canvas) {
            canvas = root.createElement('canvas');
            canvas.dataset.pageTransition = '';
            canvas.setAttribute('aria-hidden', 'true');
            canvas.style.cssText =
                'position:fixed;inset:0;width:100%;height:100%;z-index:2147483647;pointer-events:auto;display:block';
            root.documentElement.append(canvas);
        }
        context = canvas.getContext('2d');
        if (!context) {
            canvas.remove();
            canvas = null;
            release();
            return false;
        }
        bridge.cover = canvas;
        resize();
        return true;
    }
    function reset() {
        tween?.kill();
        handoff?.kill();
        view.clearTimeout(openTimer);
        view.clearTimeout(recoveryTimer);
        view.clearTimeout(bridge.fallback);
        canvas?.remove();
        canvas = bridge.cover = null;
        context = null;
        state.progress = 0;
        destination = null;
        navigating = opening = false;
        release();
    }
    function navigate() {
        if (disposed || navigating || !destination) return;
        navigating = true;
        state.progress = 1;
        draw();
        try {
            view.sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ url: destination, at: Date.now() }),
            );
        } catch {
            // Storage access can change after a click; navigation must still proceed.
        }
        try {
            view.location.assign(destination);
        } catch (error) {
            reset();
            throw error;
        }
        // Recover if a navigation is cancelled instead of unloading this document.
        recoveryTimer = view.setTimeout(() => {
            try {
                view.sessionStorage.removeItem(STORAGE_KEY);
            } catch {
                // The overlay must still clear if storage permission was revoked.
            }
            reset();
        }, 5000);
    }
    function open() {
        if (disposed || opening || !bridge.pending) return;
        opening = true;
        view.clearTimeout(openTimer);
        view.clearTimeout(bridge.fallback);
        if (motion.matches || !prepare()) {
            reset();
            return;
        }
        canvas.style.pointerEvents = 'none';
        tween = gsap.to(state, {
            progress: 0,
            duration: OPEN_DURATION,
            ease: 'power1.inOut',
            onUpdate: draw,
            onComplete: reset,
        });
        // Begin the first-screen reveals while squares are still clearing.
        handoff = gsap.delayedCall(0.12, release);
    }
    scope.on(root, 'click', (event) => {
        if (!CANVAS_LINK_TRANSITIONS_ENABLED) return;
        if (motion.matches || !(event.target instanceof view.Element)) return;
        const url = getPageTransitionUrl(
            event.target.closest('a[href]'),
            event,
            view.location.href,
        );
        if (!url) return;
        if (destination) {
            event.preventDefault();
            return;
        }
        try {
            // Check storage before taking over navigation.
            view.sessionStorage.setItem(STORAGE_KEY, 'null');
            view.sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            return;
        }
        if (!prepare()) return;
        event.preventDefault();
        tween?.kill();
        handoff?.kill();
        view.clearTimeout(openTimer);
        view.clearTimeout(bridge.fallback);
        release();
        canvas.style.pointerEvents = 'auto';
        destination = url;
        tween = gsap.to(state, {
            progress: 1,
            duration: COVER_DURATION,
            ease: 'power1.inOut',
            onUpdate: draw,
            onComplete: navigate,
        });
    });
    scope.on(view, 'resize', resize);
    scope.on(view, 'pageshow', (event) => {
        if (event.persisted) reset();
    });
    scope.on(motion, 'change', () => {
        if (!motion.matches) return;
        if (destination) navigate();
        else reset();
    });
    if (bridge.pending) {
        openTimer = view.setTimeout(open, 1200);
        root.fonts.ready.then(open);
    }
    scope.add(() => {
        disposed = true;
        reset();
    });
    return scope.destroy;
}
