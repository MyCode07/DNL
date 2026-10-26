import { createScope } from '../core/lifecycle.js';

/** Batch geometry reads once per frame instead of on every scroll event. */
export function initHeader(root, menu) {
    const header = root.querySelector('.header');
    if (!header) return;
    const menuBtn = root.querySelector('.menu ._btn');
    const sections = [...root.querySelectorAll('[data-dark]')];
    const blocks = [...root.querySelectorAll('section, footer, [data-dark]')];
    const transitions = [...root.querySelectorAll('[data-pixelated-scroll-transition]')].map(
        (element) => {
            const owner = element.closest('section, footer, [data-dark]');
            const index = blocks.indexOf(owner);
            const neighbor = blocks[index + (element.dataset.direction === 'up' ? -1 : 1)];
            return { element, neighbor: index >= 0 ? neighbor : undefined };
        },
    );
    const scope = createScope();
    const originalClasses = header.className;
    let frame = 0;
    let initialized = false;
    let previousScrollY = window.scrollY;
    let scrollingDown = true;

    function update() {
        frame = 0;
        const scrollY = window.scrollY;
        if (scrollY !== previousScrollY) scrollingDown = scrollY > previousScrollY;
        previousScrollY = scrollY;
        const headerRect = header.getBoundingClientRect();
        const position = scrollingDown ? headerRect.bottom : headerRect.top;
        const containsPosition = (rect) => {
            return scrollingDown
                ? rect.top <= position && rect.bottom > position
                : rect.top < position && rect.bottom >= position;
        };
        let dark = sections.some((section) => containsPosition(section.getBoundingClientRect()));
        // Edge pixels show the adjacent section's background before its actual boundary.
        for (const { element, neighbor } of transitions) {
            if (!neighbor) continue;
            const rect = element.getBoundingClientRect();
            if (rect.bottom > rect.top && containsPosition(rect)) {
                dark = neighbor.hasAttribute('data-dark');
                break;
            }
        }
        header.classList.toggle('header-scrolled', window.scrollY >= window.innerHeight);

        if (window.innerWidth > 1024 && !header.classList.contains('header-page') && menuBtn) {
            if (dark) {
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
