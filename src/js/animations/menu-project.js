import { gsap } from '../core/gsap.js';
import { isProjectVisible } from '../utils/menu-visibility.js';

/** This controller is the only owner of CTA height, including header scroll updates. */
export function createProjectAnimation(header, media) {
    const project = header.querySelector('.menu-project');
    const menu = header.querySelector('.menu');
    if (!project || !menu) return { sync() {}, destroy() {} };
    const context = gsap.context(() => {}, header);
    const originalInert = project.inert;
    const hasHero = Boolean(header.ownerDocument.querySelector('.hero'));
    let visible;

    function sync(immediate = false) {
        const nextVisible = isProjectVisible({
            open: menu.classList.contains('_open'),
            mobile: media.mobile.matches,
            compact: media.compact.matches || header.classList.contains('header-small'),
            scrolled: header.classList.contains('header-scrolled'),
            innerPage: !hasHero,
        });
        project.inert = !nextVisible;
        if (!immediate && visible === nextVisible) return;
        visible = nextVisible;
        context.add(() => {
            gsap.to(project, {
                height: visible ? 'auto' : 0,
                paddingTop: visible ? '0.1rem' : 0,
                paddingBottom: visible ? '0.1rem' : 0,
                duration: immediate || media.reducedMotion.matches ? 0 : 0.8,
                ease: 'power2.out',
                overwrite: true,
            });
        });
    }

    return {
        sync,
        destroy() {
            context.revert();
            project.inert = originalInert;
        },
    };
}
