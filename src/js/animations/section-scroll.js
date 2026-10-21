import { gsap } from '../core/gsap.js';

/** Shared parallax mechanics; section modules describe their own targets and timing. */
export function initSectionScroll(
    root,
    {
        selector,
        targets,
        metricsSelector = '.glass__grid',
        cardSelector = '.glass__grid-item',
        metricsStart = 'top top',
        backgroundPositionEnd = '50% 100%',
    },
) {
    const section = root.querySelector(selector);
    if (!section) return;
    const background = section.querySelector(`${selector}__bg-image`);
    const metrics = section.querySelector(metricsSelector);
    const cards = [...section.querySelectorAll(cardSelector)];
    const media = gsap.matchMedia();

    media.add(
        {
            desktop: '(min-width: 768px)',
            mobile: '(max-width: 767px)',
            reducedMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
            if (context.conditions.reducedMotion) return;
            for (const { selector: targetSelector, y, scrub } of targets) {
                const target = section.querySelector(targetSelector);
                if (!target) continue;
                gsap.to(target, {
                    y,
                    ease: 'none',
                    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub },
                });
            }

            // Shorter initial travel on mobile; each card follows the same scroll progress.
            if (metrics && cards.length) {
                gsap.fromTo(
                    cards,
                    { y: context.conditions.mobile ? '0' : '0' },
                    {
                        y: 0,
                        stagger: 0.2,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: metrics,
                            start: metricsStart,
                            end: 'bottom top',
                            scrub: 1.3,
                        },
                    },
                );
            }
            if (background) {
                gsap.fromTo(
                    background,
                    { backgroundPosition: '50% 0%' },
                    {
                        backgroundPosition: backgroundPositionEnd,
                        ease: 'linear',
                        scrollTrigger: {
                            trigger: section,
                            start: 'top top',
                            end: 'bottom bottom',
                            scrub: 1.5,
                            invalidateOnRefresh: true,
                        },
                    },
                );
            }
        },
    );
    return () => media.revert();
}
