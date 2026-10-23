import { initSectionScroll } from './section-scroll.js';
import { gsap } from '../core/gsap.js';

export function initSeoScroll(root) {
    const background = root.querySelector('.seo__bg-image');
    if (!background) return;
    const media = gsap.matchMedia();
    media.add('(min-width: 1025px)', () =>
        initSectionScroll(root, {
            selector: '.seo',
            metricsStart: 'top bottom',
            targets: [
                { selector: 'h2', y: '-10rem', scrub: 1.3 },
                { selector: '.line', y: '-10rem', scrub: 1.5 },
                { selector: '.seo-subtitle', y: '-10rem', scrub: 1.5 },
                { selector: '.seo-text', y: '-10rem', scrub: 1.5 },
            ],
        }),
    );
    return () => media.revert();
}
