import { gsap } from '../core/gsap.js';

// Independent of the heading parallax: play once across the threshold, reverse on return.
export const HERO_BACKGROUND = {
    section: '.hero',
    background: '.hero__bg-image',
    trigger: '.glass__grid-item',
    media: '(width < 767px) and (prefers-reduced-motion: no-preference)',
    entryPercent: 10,
    targetSize: '150% auto',
    horizontalAnchor: 0.5,
    duration: 0.6,
    delay: 0,
    ease: 'power2.inOut',
};

export function initHeroBackground(root) {
    const section = root.querySelector(HERO_BACKGROUND.section);
    const background = section?.querySelector(HERO_BACKGROUND.background);
    const trigger = section?.querySelector(HERO_BACKGROUND.trigger);
    if (!background || !trigger) return;

    const media = gsap.matchMedia();
    media.add(HERO_BACKGROUND.media, () => {
        const styles = root.defaultView.getComputedStyle(background);
        const initialSize = styles.backgroundSize;
        const initialPosition = styles.backgroundPosition;
        const initialX = styles.backgroundPositionX;
        const initialY = styles.backgroundPositionY;
        const targetPosition = () => {
            const width = background.getBoundingClientRect().width;
            const initialWidth = (parseFloat(initialSize) / 100) * width;
            const targetWidth = (parseFloat(HERO_BACKGROUND.targetSize) / 100) * width;
            const x = initialX.endsWith('%')
                ? ((width - initialWidth) * parseFloat(initialX)) / 100
                : parseFloat(initialX);
            return `${x - (targetWidth - initialWidth) * HERO_BACKGROUND.horizontalAnchor}px ${initialY}`;
        };
        gsap.fromTo(
            background,
            { backgroundSize: initialSize, backgroundPosition: initialPosition },
            {
                backgroundSize: HERO_BACKGROUND.targetSize,
                backgroundPosition: targetPosition,
                duration: HERO_BACKGROUND.duration,
                delay: HERO_BACKGROUND.delay,
                ease: HERO_BACKGROUND.ease,
                scrollTrigger: {
                    trigger,
                    start: `${HERO_BACKGROUND.entryPercent}% bottom`,
                    endTrigger: section,
                    end: 'bottom top',
                    toggleActions: 'play none none reverse',
                    invalidateOnRefresh: true,
                },
            },
        );
    });
    return () => media.revert();
}
