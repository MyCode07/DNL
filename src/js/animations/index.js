import { createScope } from '../core/lifecycle.js';
import { initHeroScroll } from './hero-scroll.js';
import { initCriteriaScroll } from './criteria-scroll.js';
import { initSeoScroll } from './seo-scroll.js';
import { initPixelatedScroll } from './pixelated-scroll.js';
import { initWhyItemsScroll } from './why-items-scroll.js';
import { initElementReveal } from './element-reveal.js';

// Trial switch: set false to disable all entrance animations without changing markup or CSS.
const ELEMENT_REVEAL_ENABLED = true;

/** One entry point owns all scroll-driven animations and their observers. */
export function initAnimations(root) {
    const scope = createScope();
    scope.add(initHeroScroll(root));
    scope.add(initCriteriaScroll(root));
    scope.add(initSeoScroll(root));
    scope.add(initWhyItemsScroll(root));
    scope.add(initPixelatedScroll(root));
    if (ELEMENT_REVEAL_ENABLED) scope.add(initElementReveal(root));
    return scope.destroy;
}
