import { gsap, ScrollTrigger } from '../core/gsap.js';

const SCROLL_SPEED = 1.4;
const SCRUB_DURATION = 0.5;

/** Start the horizontal passage at the section entrance, pinning the row later. */
export function initWhyItemsScroll(root) {
    const row = root.querySelector('.why-items');
    const section = row?.closest('.why');
    if (!row || !section) return;
    const cards = [...row.querySelectorAll('.why-item')];
    if (cards.length < 2) return;
    const media = gsap.matchMedia();
    const initialOffset = () =>
        document.documentElement.clientWidth - row.getBoundingClientRect().left;

    // Measure the complete row, including responsive gaps, without assuming card widths.
    const distance = () => {
        const first = cards[0].getBoundingClientRect();
        const last = cards.at(-1).getBoundingClientRect();
        return Math.max(0, last.right - first.left - row.clientWidth);
    };

    media.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', () => {
        const pin = ScrollTrigger.create({
            trigger: row,
            pin: row,
            start: () => `top ${Math.max(80, (window.innerHeight - row.offsetHeight) / 2)}px`,
            end: () => `+=${Math.max(1, (initialOffset() + distance()) / SCROLL_SPEED)}`,
            anticipatePin: 1,
        });
        gsap.fromTo(
            cards,
            { x: initialOffset },
            {
                x: () => -distance(),
                ease: 'sine.inOut',
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: () => pin.end,
                    scrub: SCRUB_DURATION,
                    invalidateOnRefresh: true,
                },
            },
        );
    });

    return () => media.revert();
}
