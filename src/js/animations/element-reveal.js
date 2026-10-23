import { gsap } from '../core/gsap.js';

const DISTANCE_REM = 5;
const DURATION = 0.8;
const POST_ITEM_STAGGER = 0.12;
const TARGETS = [
    'main .hero__content > *',
    'main .section__top > *',
    'main .glass__grid-item',
    'main ._label',
    'main .criteria-item',
    'main .projects-item > *',
    'main .projects-tabs',
    'main .seo-text',
    'main .seo-quote',
    'main .why-item',
    'main .post-item',
    'main .cta .section__body > *',
    'main .text-box > *',
].join(', ');

/** JS-only trial: independent translate leaves existing scroll/slider transforms intact. */
export function initElementReveal(root) {
    const view = root.defaultView;
    if (!view?.IntersectionObserver || !view.CSS.supports('translate', '0 1rem')) return;
    const elements = [...root.querySelectorAll(TARGETS)].filter(
        (element) => !element.parentElement.closest(TARGETS),
    );
    if (!elements.length) return;

    const media = gsap.matchMedia();
    const revealed = new WeakSet();
    media.add('(prefers-reduced-motion: no-preference)', () => {
        const states = new Map();
        const waiting = new Set();
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
            if (!immediate && view.framePageTransition?.pending) {
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
            const computed = view.getComputedStyle(element);
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
            state.tween = gsap.timeline({
                paused: true,
                defaults: { duration: DURATION, ease: 'power3.out' },
                onComplete: () => {
                    revealed.add(element);
                    restore(element, state);
                },
            });
            state.tween.fromTo(
                element,
                { opacity: 0, translate: `0 ${DISTANCE_REM}rem` },
                { opacity: Number(computed.opacity), translate: '0 0rem', immediateRender: true },
                0,
            );
            if (state.lines.length) {
                state.tween.fromTo(
                    state.lines.map(([span]) => span),
                    { maxWidth: '0%' },
                    { maxWidth: '100%', immediateRender: true },
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
            showBatch([...waiting]);
            waiting.clear();
        };
        root.addEventListener('frame:page-reveal', resume);
        return () => {
            disposed = true;
            observer.disconnect();
            root.removeEventListener('focusin', focus);
            root.removeEventListener('frame:page-reveal', resume);
            states.forEach((state, element) => restore(element, state));
        };
    });
    return () => media.revert();
}
