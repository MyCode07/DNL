import { createScope } from '../core/lifecycle.js';
import { initHeroScroll } from './hero-scroll.js';
import { initCriteriaScroll } from './criteria-scroll.js';
import { initSeoScroll } from './seo-scroll.js';
import { initPixelatedScroll } from './pixelated-scroll.js';
import { initWhyItemsScroll } from './why-items-scroll.js';

/** One entry point owns all scroll-driven animations and their observers. */
export function initAnimations(root) {
    const scope = createScope();
    scope.add(initHeroScroll(root));
    scope.add(initCriteriaScroll(root));
    scope.add(initSeoScroll(root));
    scope.add(initWhyItemsScroll(root));
    scope.add(initPixelatedScroll(root));
    return scope.destroy;
}
