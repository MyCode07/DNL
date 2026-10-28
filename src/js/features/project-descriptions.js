import { gsap, ScrollTrigger } from '../core/gsap.js';
import { createScope } from '../core/lifecycle.js';

/** Each project keeps its own disclosure state while switching tabs. */
export function initProjectDescriptions(root) {
    const media = gsap.matchMedia();
    media.add(
        {
            mobile: '(max-width: 767px)',
            reducedMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
            if (!context.conditions.mobile) return;
            const scope = createScope();
            for (const button of root.querySelectorAll('.projects-item__description-toggle')) {
                const description = button
                    .closest('.projects-item')
                    ?.querySelector('.projects-item__description');
                const label = button.querySelector('[data-description-label]');
                if (
                    !description ||
                    !label ||
                    description.id !== button.getAttribute('aria-controls')
                )
                    continue;
                const original = {
                    hidden: button.hidden,
                    expanded: button.getAttribute('aria-expanded'),
                    label: label.textContent,
                    inert: description.inert,
                };
                let open = false;
                let animation;
                button.hidden = false;
                button.setAttribute('aria-expanded', 'false');
                label.textContent = button.dataset.textOpen;
                description.inert = true;
                gsap.set(description, { height: 0, overflow: 'hidden' });
                scope.on(button, 'click', () => {
                    open = !open;
                    button.setAttribute('aria-expanded', String(open));
                    label.textContent = open ? button.dataset.textClose : button.dataset.textOpen;
                    description.inert = !open;
                    animation?.kill();
                    context.add(() => {
                        animation = gsap.to(description, {
                            height: open ? 'auto' : 0,
                            duration: context.conditions.reducedMotion ? 0 : 0.4,
                            ease: 'power2.inOut',
                            onComplete: () => ScrollTrigger.refresh(),
                        });
                    });
                });
                scope.add(() => {
                    animation?.kill();
                    button.hidden = original.hidden;
                    button.setAttribute('aria-expanded', original.expanded);
                    label.textContent = original.label;
                    description.inert = original.inert;
                });
            }
            return scope.destroy;
        },
    );
    return () => media.revert();
}
