import { createScope } from '../core/lifecycle.js';
import { gsap } from '../core/gsap.js';

/** Switch form/result layers inside the current modal without reopening it. */
export function initPopupResults(root, media) {
    const scope = createScope();
    for (const popup of root.querySelectorAll('.popup')) {
        const form = popup.querySelector('.form');
        const results = [...popup.querySelectorAll('[data-popup-result]')];
        if (!results.length) continue;
        const context = gsap.context(() => {}, popup);
        let timeline;
        let transitioning = false;
        let sourceForm;
        scope.on(popup, 'popup:request-open', (event) => {
            sourceForm = event.detail?.form;
        });

        function reset() {
            timeline?.kill();
            context.revert();
            transitioning = false;
            if (form) {
                form.hidden = false;
                form.inert = false;
            }
            results.forEach((result) => {
                result.hidden = true;
                result.inert = true;
            });
            popup.classList.remove('_result', '_success', '_error');
        }

        function showResult(event) {
            const result = results.find((item) => item.dataset.popupResult === event.detail);
            if (
                !result ||
                !popup.classList.contains('_open') ||
                transitioning ||
                (form && form.hidden)
            )
                return;
            transitioning = true;
            if (form) form.inert = true;
            popup.querySelector('.popup-close')?.focus({ preventScroll: true });
            const duration = media.reducedMotion.matches ? 0 : 0.35;
            const content = result.querySelector('.popup-result__content');
            const background = result.querySelector('.popup-result__background');
            context.add(() => {
                timeline = gsap.timeline({
                    onComplete: () => {
                        transitioning = false;
                        if (popup.classList.contains('_open')) {
                            result.inert = false;
                            (content || result).focus({ preventScroll: true });
                        }
                    },
                });
                if (form) timeline.to(form, { opacity: 0, y: -20, duration, ease: 'power2.in' });
                timeline.add(() => {
                    if (form) form.hidden = true;
                    result.hidden = false;
                    popup.scrollTop = 0;
                    popup.classList.add('_result', `_${event.detail}`);
                });
                timeline.fromTo(result, { opacity: 0 }, { opacity: 1, duration });
                if (background)
                    timeline.fromTo(
                        background,
                        { opacity: 0, scale: media.reducedMotion.matches ? 1 : 1.06 },
                        { opacity: 1, scale: 1, duration: duration * 2.5, ease: 'power2.out' },
                        '<',
                    );
                if (content)
                    timeline.fromTo(
                        content,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: duration * 1.5, ease: 'power2.out' },
                        duration * 2,
                    );
            });
        }

        scope.on(popup, 'popup:open', reset);
        scope.on(popup, 'popup:result', showResult);
        scope.on(popup, 'popup:close', () => {
            timeline?.kill();
        });
        scope.on(popup, 'click', (event) => {
            if (!(event.target instanceof Element) || !event.target.closest('[data-popup-retry]'))
                return;
            if (sourceForm) {
                popup.dispatchEvent(new CustomEvent('popup:request-close', { bubbles: true }));
                sourceForm
                    .querySelector('input:not([type="hidden"])')
                    ?.focus({ preventScroll: true });
                return;
            }
            reset();
            (form?.querySelector('input') || popup).focus({ preventScroll: true });
            popup.dispatchEvent(new CustomEvent('popup:retry', { bubbles: true }));
        });
        scope.add(reset);
    }
    return scope.destroy;
}
