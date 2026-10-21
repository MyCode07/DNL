import { initSectionScroll } from './section-scroll.js';

const CRITERIA_SCROLL_ENABLED = false;

export function initCriteriaScroll(root) {
    if (!CRITERIA_SCROLL_ENABLED) return;
    return initSectionScroll(root, {
        selector: '.criteria',
        targets: [],
        metricsSelector: '.criteria-items',
        cardSelector: '.criteria-item',
        metricsStart: 'top bottom',
    });
}
