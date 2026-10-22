import { createScope } from '../core/lifecycle.js';

/** Batch geometry reads once per frame instead of on every scroll event. */
export function initHeader(root, menu) {
    const header = root.querySelector('.header');
    if (!header) return;
    const menuBtn = root.querySelector('.menu ._btn');
    const sections = [...root.querySelectorAll('[data-dark]')];
    const scope = createScope();
    const originalClasses = header.className;
    let frame = 0;
    let initialized = false;

    function update() {
        frame = 0;
        const position = header.getBoundingClientRect().top + header.offsetHeight;
        const dark = sections.some((section) => {
            const rect = section.getBoundingClientRect();
            return rect.top <= position && rect.bottom > position;
        });
        header.classList.toggle('header-scrolled', window.scrollY >= window.innerHeight);

        if (window.innerWidth > 1024 && !header.classList.contains('header-page') && menuBtn) {
            if (header.classList.contains('dark')) {
                menuBtn.classList.remove('_btn-white');
                menuBtn.classList.add('_btn-black');
            } else {
                menuBtn.classList.remove('_btn-black');
                menuBtn.classList.add('_btn-white');
            }
        }
        header.classList.toggle('dark', dark);
        if (!header.classList.contains('header-page')) menu?.syncProject(!initialized);
        initialized = true;
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    scope.on(window, 'scroll', schedule, { passive: true });
    scope.on(window, 'resize', schedule);
    scope.add(() => {
        cancelAnimationFrame(frame);
        header.className = originalClasses;
    });
    return scope.destroy;
}
