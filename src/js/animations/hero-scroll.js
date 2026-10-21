import { initSectionScroll } from './section-scroll.js';

// Preserve the hero's separate heading/subtitle speeds and metric reveal timing.
export function initHeroScroll(root) {
    return initSectionScroll(root, {
        selector: '.hero',
        targets: [
            { selector: 'h1', y: '-18rem', scrub: 1.3 },
            { selector: '.h1-subtitle', y: '-12rem', scrub: 1.5 },
        ],
    });
}
