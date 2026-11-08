import CornerKit from '@cornerkit/core';
import { createScope } from '../core/lifecycle.js';

const TARGETS = [
    // '._btn',
    '.arrow-btn',
    '.header__logo',
    '.menu-surface',
    '.glass__grid-item',
    '.criteria-item',
    '.projects-item__content',
    '.projects-item__labels .loc',
    '.projects-item .swiper',
    '.projects-item__grid div',
    '.next',
    '.prev',
    '.why-item',
    '.post-item .img',
    '._social a',
    '._social button',
    '.single-content img',
    '.form__checkboxes-text input',
    '.form__checkboxes .wpcf7-radio label',
    '.popup-close',
].join(', ');

export function initIosBorder(root) {
    const elements = [...root.querySelectorAll(TARGETS)].filter(
        (element) => !element.parentElement?.closest(TARGETS),
    );
    if (!elements.length) return;

    const scope = createScope();
    const desktop = root.defaultView.matchMedia('(min-width: 768px)');
    let cornerKit;
    function update() {
        cornerKit?.destroy();
        cornerKit = undefined;
        if (!desktop.matches) return;
        cornerKit = new CornerKit();
        try {
            elements.forEach((element) => {
                const radius = parseFloat(
                    root.defaultView.getComputedStyle(element).borderTopLeftRadius,
                );
                if (!Number.isFinite(radius) || radius <= 0) return;
                cornerKit.apply(element, { radius, smoothing: 0.6 });
            });
        } catch (error) {
            scope.destroy();
            throw error;
        }
    }
    scope.add(() => cornerKit?.destroy());
    scope.on(desktop, 'change', update);
    update();
    return scope.destroy;
}
