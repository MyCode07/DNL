import { gsap } from '../core/gsap.js';
import { createScope } from '../core/lifecycle.js';
import { createPixelCells } from '../utils/pixels.js';

const STORAGE_KEY = 'frame:page-transition';
const COVER_DURATION = 0.65;
const OPEN_DURATION = 0.75;

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
        url.hash ||
        (url.pathname === current.pathname && url.search === current.search) ||
        /\/(?:wp-admin(?:\/|$)|wp-login\.php)/i.test(url.pathname) ||
        /\.(?:pdf|zip|gz|rar|7z|jpe?g|png|webp|svg|gif|mp[34]|webm|docx?|xlsx?|csv)$/i.test(
            url.pathname,
        )
    )
        return null;
    return url.href;
}

/** One removable module owns the cover, navigation interception and entrance handoff. */
export function initPageTransition(root) {
    const view = root.defaultView;
    const bridge = view?.framePageTransition;
    if (!bridge?.enabled) return;
    const scope = createScope();
    const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
    const state = { progress: bridge.pending ? 1 : 0 };
    let cover = bridge.cover;
    let context;
    let cells = [];
    let tween;
    let recoveryTimer;
    let destination;
    let navigating = false;
    let disposed = false;
    let opening = false;

    const release = () => {
        if (bridge.pending) bridge.release();
    };
    function draw() {
        if (bridge.solidCover) {
            cover.style.opacity = String(state.progress);
            return;
        }
        try {
            context.clearRect(0, 0, cover.width, cover.height);
            if (state.progress <= 0) return;
            context.fillStyle = '#000';
            for (const cell of cells) {
                if (state.progress >= cell.threshold) {
                    context.fillRect(cell.x, cell.y, cell.width, cell.height);
                }
            }
        } catch {
            // A lost context must not trap an intercepted navigation.
            const url = destination;
            reset();
            if (url) view.location.assign(url);
        }
    }
    function resize() {
        if (!cover || (!bridge.solidCover && !context)) return;
        // Safari can report viewport units smaller than the revealed toolbar area.
        const viewportHeight = Math.max(
            view.innerHeight,
            (view.visualViewport?.height || 0) + (view.visualViewport?.offsetTop || 0),
        );
        cover.style.minHeight = `${Math.ceil(viewportHeight)}px`;
        if (bridge.solidCover) {
            draw();
            return;
        }
        const { width, height } = cover.getBoundingClientRect();
        const size = width <= 767 ? 40 : width <= 1280 ? 80 : 100;
        const columns = Math.ceil(width / size);
        const pixel = width / columns;
        const rows = Math.ceil(height / pixel);
        const ratio = Math.min(view.devicePixelRatio || 1, 2);
        const bitmapWidth = Math.round(width * ratio);
        const bitmapHeight = Math.round(height * ratio);
        if (cells.length && cover.width === bitmapWidth && cover.height === bitmapHeight) return;
        cover.width = bitmapWidth;
        cover.height = bitmapHeight;
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
        try {
            if (!cover) {
                cover = root.createElement(bridge.solidCover ? 'div' : 'canvas');
                cover.dataset.pageTransition = '';
                cover.setAttribute('aria-hidden', 'true');
                cover.style.cssText =
                    'position:fixed;inset:0 0 auto;width:100%;height:100vh;height:max(100lvh,100dvh);min-height:100%;z-index:2147483647;pointer-events:auto;display:block';
                const container = root.body ?? root.documentElement;
                container.append(cover);
            }
            if (bridge.solidCover) cover.style.backgroundColor = '#000';
            else context = cover.getContext('2d');
            if (!bridge.solidCover && !context) {
                reset();
                return false;
            }
            bridge.cover = cover;
            resize();
            return Boolean(cover && (bridge.solidCover || context));
        } catch {
            reset();
            return false;
        }
    }
    function reset(reveal = true) {
        tween?.kill();
        view.clearTimeout(recoveryTimer);
        view.clearTimeout(bridge.fallback);
        cover?.remove();
        cover = bridge.cover = null;
        context = null;
        state.progress = 0;
        destination = null;
        navigating = opening = false;
        if (reveal) release();
    }
    function navigate() {
        if (disposed || navigating || !destination) return;
        navigating = true;
        state.progress = 1;
        draw();
        if (!destination) return;
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
        view.clearTimeout(recoveryTimer);
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
        view.clearTimeout(bridge.fallback);
        if (motion.matches || !prepare()) {
            reset();
            return;
        }
        cover.style.pointerEvents = 'none';
        recoveryTimer = view.setTimeout(reset, 4000);
        try {
            tween = gsap.to(state, {
                progress: 0,
                duration: OPEN_DURATION,
                ease: 'power1.inOut',
                onUpdate: draw,
                onComplete: reset,
            });
        } catch {
            reset();
        }
    }
    scope.on(root, 'click', (event) => {
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
        view.clearTimeout(bridge.fallback);
        release();
        cover.style.pointerEvents = 'auto';
        destination = url;
        view.clearTimeout(recoveryTimer);
        recoveryTimer = view.setTimeout(() => {
            reset();
            view.location.assign(url);
        }, 5000);
        try {
            tween = gsap.to(state, {
                progress: 1,
                duration: COVER_DURATION,
                ease: 'power1.inOut',
                onUpdate: draw,
                onComplete: navigate,
            });
        } catch {
            reset();
            view.location.assign(url);
        }
    });
    scope.on(view, 'resize', resize);
    if (view.visualViewport) scope.on(view.visualViewport, 'resize', resize);
    scope.on(view, 'pageshow', (event) => {
        if (!event.persisted) return;
        // Keep queued reveals waiting while replacing a cached outgoing cover.
        reset(false);
        if (motion.matches) {
            release();
            return;
        }
        bridge.pending = true;
        state.progress = 1;
        open();
    });
    scope.on(motion, 'change', () => {
        if (!motion.matches) return;
        if (destination) navigate();
        else reset();
    });
    if (bridge.pending) {
        // Settle layout before opening; the bootstrap watchdog covers stalled resources.
        Promise.resolve(root.fonts?.ready).then(open, open);
    }
    scope.add(() => {
        disposed = true;
        reset();
    });
    return scope.destroy;
}
