import { gsap } from '../core/gsap.js';

// Independent of heading parallax: zoom while the first metric enters the viewport.
export const HERO_BACKGROUND = {
    section: '.hero',
    background: '.hero__photo',
    trigger: '.glass__grid-item',
    media: '(width < 767px)',
    start: 'top bottom',
    end: 'bottom bottom',
    scrub: true,
    targetWidthPercent: 200,
};

export function initHeroBackground(root) {
    const section = root.querySelector(HERO_BACKGROUND.section);
    const background = section?.querySelector(HERO_BACKGROUND.background);
    const trigger = section?.querySelector(HERO_BACKGROUND.trigger);
    if (!background || !trigger) return;

    const media = gsap.matchMedia();
    media.add(HERO_BACKGROUND.media, () => {
        const targetScale = () => {
            const styles = root.defaultView.getComputedStyle(background);
            const widthPercent = parseFloat(styles.getPropertyValue('--photo-width'));
            return HERO_BACKGROUND.targetWidthPercent / widthPercent;
        };
        gsap.fromTo(
            background,
            { scale: 1 },
            {
                scale: targetScale,
                ease: 'none',
                scrollTrigger: {
                    trigger,
                    start: HERO_BACKGROUND.start,
                    end: HERO_BACKGROUND.end,
                    scrub: HERO_BACKGROUND.scrub,
                    invalidateOnRefresh: true,
                },
            },
        );
    });
    return () => media.revert();
}
