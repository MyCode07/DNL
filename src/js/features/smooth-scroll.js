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
            autoToggle: true,
            allowNestedScroll: true,
        });
        unsubscribe = lenis.on('scroll', ScrollTrigger.update);
        tick = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
    }

    configure();
    scope.on(media.reducedMotion, 'change', configure);
    scope.add(() => {
        disposeLenis();
        html.style.scrollBehavior = originalScrollBehavior;
    });
    return scope.destroy;
}
