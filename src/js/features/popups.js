import { createScope } from '../core/lifecycle.js';
import { getFocusableElements } from '../utils/focus.js';

/** One active modal, delegated triggers, keyboard dismissal and restored focus. */
export function initPopups(root) {
    const scope = createScope();
    const popups = [...root.querySelectorAll('.popup')];
    const panels = new Map(
        popups.map((popup) => [popup, popup.querySelector('.popup-panel') || popup]),
    );
    const view = root.defaultView;
    const viewport = view?.visualViewport;
    const isIPhone = /\biPhone\b/.test(view?.navigator.userAgent);
    const wrap = isIPhone ? root.getElementById('popups-wrap') : null;
    const cover = wrap?.querySelector('.popup-toolbar-cover');
    let active;
    let opener;
    let opening;
    const pendingCloses = new Map();

    function positionCover() {
        const top = viewport?.offsetTop || 0;
        const bottom = Math.max(view.innerHeight, top + (viewport?.height || 0));
        cover.style.setProperty(
            '--popup-viewport-top',
            `${top - wrap.getBoundingClientRect().top}px`,
        );
        cover.style.setProperty('--popup-viewport-height', `${bottom - top}px`);
    }

    function afterClose(popup, done) {
        const animations = panels.get(popup).getAnimations();
        if (cover) animations.push(...cover.getAnimations());
        if (!animations.length) {
            done();
            return;
        }
        const finish = () => {
            if (pendingCloses.get(popup) !== finish) return;
            pendingCloses.delete(popup);
            done();
        };
        pendingCloses.set(popup, finish);
        Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
    }

    for (const popup of popups) {
        scope.on(popup, 'cancel', (event) => {
            event.preventDefault();
            if (active === popup) close();
        });
        scope.on(popup, 'close', () => {
            if (active === popup && !popup.open) close();
        });
    }

    function close({ restoreFocus = true } = {}) {
        if (!active) return;
        const activePopup = active;
        opening = undefined;
        if (cover) {
            positionCover();
            active.classList.add('_closing');
        }
        active.classList.remove('_backdrop');
        active.classList.remove('_open');
        active.inert = true;
        active.dispatchEvent(new CustomEvent('popup:close', { bubbles: true }));
        active = undefined;
        const previousOpener = opener;
        afterClose(activePopup, () => {
            activePopup.classList.remove('_closing');
            if (cover && !active && !pendingCloses.size) {
                cover.hidden = true;
                cover.classList.remove('_retry');
            }
            activePopup.close();
            activePopup.inert = false;
            if (restoreFocus && !active && previousOpener?.isConnected) {
                previousOpener.focus({ preventScroll: true });
            }
        });
        opener = undefined;
    }

    function open(popup, trigger) {
        if (active === popup) return;
        close({ restoreFocus: false });
        pendingCloses.delete(popup);
        active = popup;
        opener = trigger;
        popup.inert = false;
        if (!popup.open) popup.showModal();
        if (cover) {
            popup.classList.remove('_closing');
            cover.classList.remove('_retry');
            cover.hidden = false;
            positionCover();
            cover.getBoundingClientRect();
        }
        // Establish the initial position before the opening transition.
        const panel = panels.get(popup);
        panel.getBoundingClientRect();
        popup.classList.add('_open');
        const currentOpening = Symbol();
        opening = currentOpening;
        const finishOpening = () => {
            if (opening === currentOpening && active === popup && popup.open) {
                popup.classList.add('_backdrop');
            }
        };
        const animations = panel.getAnimations();
        if (animations.length) {
            Promise.allSettled(animations.map((animation) => animation.finished)).then(
                finishOpening,
            );
        } else {
            finishOpening();
        }
        popup.dispatchEvent(new CustomEvent('popup:open', { bubbles: true }));
        (getFocusableElements(popup)[0] || popup).focus({ preventScroll: true });
    }

    if (cover) {
        const syncCover = () => {
            if (!cover.hidden) positionCover();
        };
        scope.on(view, 'resize', syncCover);
        scope.on(view, 'scroll', syncCover);
        if (viewport) {
            scope.on(viewport, 'resize', syncCover);
            scope.on(viewport, 'scroll', syncCover);
        }
        scope.on(wrap, 'popup:retry', (event) => {
            if (event.target === active && !active.querySelector('.form')) {
                cover.classList.add('_retry');
            }
        });
    }

    if (viewport && isIPhone) {
        let frame;

        function adjustPanelHeight() {
            frame = undefined;
            if (!active?.open) return;

            const panel = panels.get(active);
            if (panel === active) return;
            const field = root.activeElement;
            const editing =
                panel.contains(field) &&
                field.matches(
                    'textarea:not([readonly]), input:not([readonly]):is([type="text"], [type="email"], [type="tel"], [type="url"], [type="search"], [type="password"], [type="number"], :not([type]))',
                ) &&
                field.inputMode !== 'none';
            // Use the dialog top so the slide animation does not affect the measurement.
            const bounds = active.getBoundingClientRect();
            const visibleBottom = viewport.offsetTop + viewport.height;
            // The viewport can pan past the dialog while the keyboard is still open.
            const keyboardVisible =
                viewport.height < bounds.height &&
                (editing || active.classList.contains('_keyboard'));
            active.classList.toggle('_keyboard', keyboardVisible);
            if (editing && visibleBottom < bounds.bottom) {
                panel.style.maxHeight = `${Math.max(0, visibleBottom - bounds.top)}px`;
            } else {
                panel.style.removeProperty('max-height');
            }
        }

        function scheduleAdjustment() {
            if (active && frame === undefined) {
                frame = view.requestAnimationFrame(adjustPanelHeight);
            }
        }

        scope.on(viewport, 'resize', scheduleAdjustment);
        scope.on(viewport, 'scroll', scheduleAdjustment);
        scope.on(root, 'focusin', scheduleAdjustment);
        scope.on(root, 'focusout', scheduleAdjustment);
        scope.on(root, 'popup:close', (event) => {
            event.target.classList.remove('_keyboard');
            panels.get(event.target)?.style.removeProperty('max-height');
        });
        scope.add(() => {
            view.cancelAnimationFrame(frame);
            active?.classList.remove('_keyboard');
            panels.get(active)?.style.removeProperty('max-height');
        });
    }

    scope.on(root, 'popup:request-open', (event) => {
        if (!popups.includes(event.target)) return;
        open(event.target, event.detail.trigger);
        if (event.detail.result)
            event.target.dispatchEvent(
                new CustomEvent('popup:result', {
                    detail: event.detail.result,
                }),
            );
    });
    scope.on(root, 'popup:request-close', (event) => {
        if (event.target === active) close();
    });
    scope.on(root, 'click', (event) => {
        if (!(event.target instanceof Element)) return;
        const trigger = event.target.closest('[data-open-popup]');
        if (trigger) {
            const popup = root.getElementById(trigger.dataset.openPopup);
            if (!popups.includes(popup)) return;
            event.preventDefault();
            open(popup, trigger);
            return;
        }
        if (!active) return;
        const closeButton = event.target.closest('.popup-close, [data-close-popup]');
        if ((closeButton && active.contains(closeButton)) || event.target === active) close();
    });
    scope.add(() => {
        close();
        for (const finish of pendingCloses.values()) finish();
    });
    return scope.destroy;
}
