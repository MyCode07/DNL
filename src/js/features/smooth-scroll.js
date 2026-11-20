import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { createScope } from '../core/lifecycle.js';

export function initSmoothScroll(media) {
    const scope = createScope();
    const html = document.documentElement;
    const originalScrollBehavior = html.style.scrollBehavior;
    let lenis;
    let tick;
    let unsubscribe;
    let stopped = false;

    function disposeLenis() {
        if (!lenis) return;
        gsap.ticker.remove(tick);
        unsubscribe();
        lenis.destroy();
        lenis = undefined;
    }

    function configure() {
        disposeLenis();
        html.style.scrollBehavior = media.reducedMotion.matches ? 'auto' : originalScrollBehavior;
        if (media.reducedMotion.matches) return;
        lenis = new Lenis({
            duration: 1.15,
            wheelMultiplier: 0.9,
            // Overlay content scrolls natively while page scrolling is locked.
            prevent: (element) => Boolean(element.closest('.popup, .menu-body')),
        });
        unsubscribe = lenis.on('scroll', ScrollTrigger.update);
        tick = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        if (stopped) lenis.stop();
    }

    configure();
    scope.on(media.reducedMotion, 'change', configure);
    scope.add(() => {
        disposeLenis();
        html.style.scrollBehavior = originalScrollBehavior;
    });
    return {
        stop() {
            stopped = true;
            lenis?.stop();
        },
        start() {
            stopped = false;
            lenis?.start();
        },
        destroy: scope.destroy,
    };
}
