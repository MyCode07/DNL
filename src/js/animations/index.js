import { createScope } from '../core/lifecycle.js';
import { initHeroScroll } from './hero-scroll.js';
import { initHeroBackground } from './hero-background.js';
import { initCriteriaScroll } from './criteria-scroll.js';
import { initSeoScroll } from './seo-scroll.js';
import { initPixelatedScroll } from './pixelated-scroll.js';
import { initElementReveal } from './element-reveal.js';

// Trial switch: set false to disable all entrance animations without changing markup or CSS.
const ELEMENT_REVEAL_ENABLED = true;

/** One entry point owns all scroll-driven animations and their observers. */
export function initAnimations(root) {
    const scope = createScope();
    // Measure existing parallax baselines before the CSS entrance offset is applied.
    root.documentElement.classList.add('reveal-initializing');
    root.documentElement.classList.toggle('reveal-disabled', !ELEMENT_REVEAL_ENABLED);
    scope.add(initHeroScroll(root));
    scope.add(initHeroBackground(root));
    scope.add(initCriteriaScroll(root));
    scope.add(initSeoScroll(root));
    scope.add(initPixelatedScroll(root));
    root.documentElement.classList.remove('reveal-initializing');
    if (ELEMENT_REVEAL_ENABLED) scope.add(initElementReveal(root));
    return scope.destroy;
}
