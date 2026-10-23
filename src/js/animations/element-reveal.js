import { gsap } from '../core/gsap.js';
import { getRevealDelay } from '../utils/reveal-delay.js';

const DURATION = 0.8;
const POST_ITEM_STAGGER = 0.12;
export const ELEMENT_REVEAL_TARGETS = [
    'main .hero__content > *',
    'main .section__top > *',
    'main .glass__grid-item',
    'main ._label',
    'main .criteria-item',
    'main .projects-item > *',
    'main .projects-tabs',
    'main .deals-controls',
    'main .seo-text',
    'main .seo-quote',
    'main .why-item',
    'main .post-item',
    'main .cta .section__body > *',
    'main .text-box > *',
    'main .single-data__item',
    'main .single-data__share',
    '.footer__top',
    '.footer__bottom',
].join(', ');

/** CSS owns the initial state; independent translate preserves existing scroll transforms. */
export function initElementReveal(root) {
    const view = root.defaultView;
    if (view) view.frameElementRevealReady = true;
    if (!view?.IntersectionObserver || !view.CSS.supports('translate', '0 1rem')) {
        root.documentElement.classList.add('reveal-disabled');
        return;
    }
    root.documentElement.classList.remove('reveal-disabled');
    const elements = [...root.querySelectorAll(ELEMENT_REVEAL_TARGETS)].filter(
        (element) => !element.parentElement.closest(ELEMENT_REVEAL_TARGETS),
    );
    if (!elements.length) return;

    const media = gsap.matchMedia();
    const revealed = new WeakSet();
    const originalClasses = new Map(
        elements.map((element) => [element, element.classList.contains('is-revealed')]),
    );
    media.add('(prefers-reduced-motion: no-preference)', () => {
        const states = new Map();
        const waiting = new Set();
        let ready = false;
        let disposed = false;
        const restore = (element, state) => {
            for (const [name, value, priority] of state.styles) {
                if (value) element.style.setProperty(name, value, priority);
                else element.style.removeProperty(name);
            }
            state.lines.forEach(([span, value, priority]) => {
                if (value) span.style.setProperty('max-width', value, priority);
                else span.style.removeProperty('max-width');
            });
        };
        const show = (element, immediate = false, delay = 0) => {
            const state = states.get(element);
            if (disposed || !state || revealed.has(element)) return;
            if (!immediate && (!ready || view.framePageTransition?.pending)) {
                waiting.add(element);
                return;
            }
            observer.unobserve(element);
            if (immediate) state.tween.progress(1);
            else state.tween.delay(delay).restart(true);
        };
        const showBatch = (targets) => {
            const groups = new Map();
            targets.forEach((element) => {
                let delay = 0;
                if (element.matches('.post-item')) {
                    const group =
                        element.closest('.grid, .swiper-wrapper') || element.parentElement;
                    const index = groups.get(group) || 0;
                    delay = index * POST_ITEM_STAGGER;
                    groups.set(group, index + 1);
                }
                show(element, false, delay);
            });
        };
        const observer = new view.IntersectionObserver(
            (entries) => {
                const visible = [];
                entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
                    // Restored scroll positions must not leave earlier content hidden.
                    if (isIntersecting) visible.push(target);
                    else if (boundingClientRect.height > 0 && boundingClientRect.bottom <= 0) {
                        show(target, true);
                    }
                });
                showBatch(visible);
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0 },
        );

        elements.forEach((element) => {
            // Read the natural destination synchronously, without allowing a visible frame.
            element.classList.add('is-revealed');
            const computed = view.getComputedStyle(element);
            const opacity = Number(computed.opacity);
            if (revealed.has(element) || computed.translate !== 'none') return;
            const state = {
                styles: ['opacity', 'translate'].map((name) => [
                    name,
                    element.style.getPropertyValue(name),
                    element.style.getPropertyPriority(name),
                ]),
                lines: [...element.querySelectorAll('.line > span')].map((span) => [
                    span,
                    span.style.getPropertyValue('max-width'),
                    span.style.getPropertyPriority('max-width'),
                ]),
            };
            states.set(element, state);
            element.classList.remove('is-revealed');
            // GSAP's parallax parser writes a neutral inline translate; let CSS supply the start.
            if (element.style.translate === 'none') element.style.removeProperty('translate');
            state.tween = gsap.timeline({
                paused: true,
                defaults: { duration: DURATION, ease: 'power3.out' },
                onComplete: () => {
                    revealed.add(element);
                    element.classList.add('is-revealed');
                    restore(element, state);
                },
            });
            state.tween.to(element, { opacity, translate: '0 0rem' }, 0);
            if (state.lines.length) {
                state.tween.to(
                    state.lines.map(([span]) => span),
                    { maxWidth: '100%' },
                    0,
                );
            }
            observer.observe(element);
        });

        const focus = (event) => {
            states.forEach((state, element) => {
                if (element.contains(event.target)) show(element, true);
            });
        };
        root.addEventListener('focusin', focus);
        const resume = () => {
            if (!ready || view.framePageTransition?.pending) return;
            const targets = [...waiting];
            waiting.clear();
            showBatch(targets);
        };
        root.addEventListener('frame:page-reveal', resume);
        const delay = getRevealDelay(root);
        const transition = root.querySelector('.page-transition[data-reveal-delay]');
        const tiles =
            transition
                ?.getAnimations?.({ subtree: true })
                .filter((animation) => animation.animationName === 'tile-reveal') || [];
        let delayReady = delay === 0;
        let tilesReady = tiles.every((animation) => animation.playState === 'finished');
        const updateReady = () => {
            if (disposed) return;
            ready = delayReady && tilesReady;
            if (ready) resume();
        };
        updateReady();
        if (!tilesReady) {
            // A cancelled CSS animation also releases the content; its timing stays in CSS.
            Promise.all(tiles.map((animation) => animation.finished.catch(() => {}))).then(() => {
                tilesReady = true;
                updateReady();
            });
        }
        const timer = delayReady
            ? null
            : view.setTimeout(() => {
                  delayReady = true;
                  updateReady();
              }, delay);
        return () => {
            disposed = true;
            view.clearTimeout(timer);
            observer.disconnect();
            root.removeEventListener('focusin', focus);
            root.removeEventListener('frame:page-reveal', resume);
            states.forEach((state, element) => {
                restore(element, state);
                if (!revealed.has(element) && !originalClasses.get(element)) {
                    element.classList.remove('is-revealed');
                }
            });
        };
    });
    return () => {
        media.revert();
        root.documentElement.classList.add('reveal-disabled');
        originalClasses.forEach((hadClass, element) =>
            element.classList.toggle('is-revealed', hadClass),
        );
    };
}
