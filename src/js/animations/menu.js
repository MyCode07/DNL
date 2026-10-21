import { gsap } from '../core/gsap.js';

const OPEN_ICON = [0.2, 1, 0.2, 1, 1, 1, 0.2, 1, 0.2];
const CLOSE_ICON = [1, 0.2, 1, 0.2, 1, 0.2, 1, 0.2, 1];

// Measure after expansion, not at the square's width where text wraps into extra lines.
function measureBodyHeight(menu, surface, body, width, padding) {
    const styles = [menu.style.cssText, surface.style.cssText, body.style.cssText];
    try {
        menu.style.width = width;
        surface.style.padding = padding;
        body.style.height = 'auto';
        return body.getBoundingClientRect().height;
    } finally {
        [menu, surface, body].forEach((element, index) => {
            element.style.cssText = styles[index];
        });
    }
}

/** One timeline per menu; interrupted transitions continue from current rendered values. */
export function createMenuAnimation(menu, { media, toggle }) {
    const label = toggle.querySelector('span');
    const body = menu.querySelector('.menu-body');
    const surface = menu.querySelector('.menu-surface');
    const project = menu.querySelector('.menu-project');
    const outerLogo = menu.closest('.header')?.querySelector('.header__logo');
    const innerLogo = menu.querySelector('.menu-logo');
    const logos = [outerLogo, innerLogo].filter(Boolean);
    const originalLogoInert = logos.map((logo) => logo.inert);
    const heroButton = menu.ownerDocument.querySelector('.hero__button');
    const items = [...menu.querySelectorAll('[data-animate-menu]')];
    const rects = [...toggle.querySelectorAll('rect')];
    const originalOpacity = rects.map((rect) => rect.getAttribute('fill-opacity'));
    const originalBodyInert = body.inert;
    const originalHeroInert = heroButton?.inert;
    const context = gsap.context(() => {}, menu);
    let timeline;

    function setIcon(open) {
        const opacity = open ? CLOSE_ICON : OPEN_ICON;
        rects.forEach((rect, index) => rect.setAttribute('fill-opacity', opacity[index]));
    }

    function animate(open) {
        timeline?.kill();
        const mobile = media.mobile.matches;
        const compact = media.compact.matches;
        const reducedMotion = media.reducedMotion.matches;
        body.inert = !open;
        if (outerLogo) outerLogo.inert = mobile && open;
        if (innerLogo) innerLogo.inert = true;
        if (heroButton) heroButton.inert = compact && open;
        setIcon(open);
        const width = mobile ? '100vw' : '33.6rem';
        const padding = mobile ? '2rem' : '1.6rem 2rem';
        const measure = open && compact && !mobile;
        const height = measure
            ? measureBodyHeight(menu, surface, body, width, padding)
            : open
              ? 'auto'
              : 0;

        context.add(() => {
            timeline = gsap.timeline({
                defaults: { duration: reducedMotion ? 0 : 0.8, ease: 'power2.out' },
            });
            const logoDuration = reducedMotion ? 0 : 0.2;
            const expandAt = reducedMotion ? 0 : mobile ? 0.2 : compact && !open ? 0.2 : 0;
            const finishAt = expandAt + (reducedMotion ? 0 : 0.8);
            if (compact && label) {
                if (open) label.textContent = label.dataset.textClose;
                timeline.to(
                    label,
                    {
                        autoAlpha: open ? 1 : 0,
                        x: open ? 0 : 6,
                        duration: logoDuration,
                        onComplete: () => {
                            if (!open) label.textContent = label.dataset.textOpen;
                        },
                    },
                    open ? finishAt : 0,
                );
            }
            if (mobile) {
                timeline.to(toggle, { padding: open ? 0 : '1rem 1rem 0 0' }, expandAt);
                const disappearingLogo = open ? outerLogo : innerLogo;
                const appearingLogo = open ? innerLogo : outerLogo;
                if (disappearingLogo) {
                    timeline.to(disappearingLogo, { autoAlpha: 0, duration: logoDuration }, 0);
                }
                if (appearingLogo) {
                    timeline.to(
                        appearingLogo,
                        {
                            autoAlpha: 1,
                            duration: logoDuration,
                            onComplete: () => {
                                appearingLogo.inert = false;
                            },
                        },
                        finishAt,
                    );
                }
            }
            timeline.to(
                body,
                {
                    height,
                    onComplete: () => {
                        if (measure) gsap.set(body, { height: 'auto' });
                    },
                },
                expandAt,
            );
            if (compact) {
                timeline.to(
                    menu,
                    {
                        width: open ? width : mobile ? '4.4rem' : '5.2rem',
                        ...(mobile
                            ? {
                                  height: open ? '100dvh' : '4.4rem',
                                  top: open ? 0 : '1.6rem',
                                  right: open ? 0 : '1.6rem',
                              }
                            : {}),
                    },
                    expandAt,
                );
                timeline.to(
                    surface,
                    {
                        padding: open ? padding : mobile ? 0 : '1.4rem',
                        ...(mobile
                            ? {
                                  height: open
                                      ? `calc(100dvh - ${project.scrollHeight}px)`
                                      : '4.4rem',
                                  borderRadius: open ? 0 : '1.4rem',
                              }
                            : {}),
                    },
                    expandAt,
                );
            }
            if (compact && heroButton)
                timeline.to(heroButton, { height: open ? 0 : 'auto' }, expandAt);
            timeline.to(
                items,
                {
                    filter: open ? 'blur(0px)' : 'blur(0.2rem)',
                    duration: reducedMotion ? 0 : 0.3,
                },
                expandAt + (!reducedMotion && open ? 0.3 : 0),
            );
        });
    }

    function reset() {
        timeline?.kill();
        context.add(() => {
            gsap.set([menu, surface, body], {
                clearProps: 'width,height,padding,transform,top,right,borderRadius',
            });
            gsap.set(items, { clearProps: 'filter' });
            gsap.set(toggle, { clearProps: 'padding' });
            if (label) gsap.set(label, { clearProps: 'opacity,visibility,transform' });
            gsap.set(logos, { clearProps: 'opacity,visibility' });
            if (heroButton) gsap.set(heroButton, { clearProps: 'height' });
        });
        body.inert = true;
        if (outerLogo) outerLogo.inert = false;
        if (innerLogo) innerLogo.inert = true;
        if (heroButton) heroButton.inert = false;
        setIcon(false);
    }

    return {
        animate,
        reset,
        destroy() {
            timeline?.kill();
            context.revert();
            logos.forEach((logo, index) => {
                logo.inert = originalLogoInert[index];
            });
            body.inert = originalBodyInert;
            if (heroButton) heroButton.inert = originalHeroInert;
            rects.forEach((rect, index) => {
                if (originalOpacity[index] === null) rect.removeAttribute('fill-opacity');
                else rect.setAttribute('fill-opacity', originalOpacity[index]);
            });
        },
    };
}
