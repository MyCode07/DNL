import { createScope } from '../core/lifecycle.js';
import { getFocusableElements } from '../utils/focus.js';

/** One active modal, delegated triggers, keyboard dismissal and restored focus. */
export function initPopups(root, scrollLock, media) {
    const scope = createScope();
    const popups = [...root.querySelectorAll('.popup')];
    const panels = new Map(
        popups.map((popup) => [popup, popup.querySelector('.popup-panel') || popup]),
    );
    const snapshots = popups.map((popup) => [
        popup,
        popup.getAttribute('role'),
        popup.getAttribute('aria-modal'),
        popup.inert,
        popup.getAttribute('tabindex'),
        popup.getAttribute('aria-label'),
    ]);
    const transitions = [...panels.values()].map((panel) => [
        panel,
        panel.style.transitionDuration,
    ]);
    const closeButtons = [...root.querySelectorAll('.popup-close')];
    const closeLabels = closeButtons.map((button) => button.getAttribute('aria-label'));
    const closeLabel = root.querySelector('.menu-toggle span')?.dataset.textClose || 'Close dialog';
    closeButtons.forEach((button) => {
        if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', closeLabel);
    });
    function updateMotion() {
        transitions.forEach(([panel, duration]) => {
            panel.style.transitionDuration = media.reducedMotion.matches ? '0s' : duration;
        });
    }
    updateMotion();
    scope.on(media.reducedMotion, 'change', updateMotion);
    let active;
    let opener;
    let releaseScroll;
    let opening;
    const pendingCloses = new Set();

    function releaseAfterClose(popup, release) {
        if (!release) return;
        const complete = () => {
            if (active !== popup) popup.close();
            release();
        };
        const animations = panels.get(popup).getAnimations();
        if (!animations.length) {
            complete();
            return;
        }
        const finish = () => {
            if (!pendingCloses.delete(finish)) return;
            complete();
        };
        pendingCloses.add(finish);
        // CSS owns the duration; cancellation (reopening or reduced motion) also settles it.
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
        popup.inert = true;
    }

    function close({ restoreFocus = true } = {}) {
        if (!active) return;
        const activePopup = active;
        opening = undefined;
        active.classList.remove('_backdrop');
        active.classList.remove('_open');
        active.inert = true;
        active.dispatchEvent(new CustomEvent('popup:close', { bubbles: true }));
        active = undefined;
        const previousOpener = opener;
        const release = releaseScroll;
        releaseAfterClose(activePopup, () => {
            release?.();
            if (restoreFocus && !active && previousOpener?.isConnected) {
                previousOpener.focus({ preventScroll: true });
            }
        });
        releaseScroll = undefined;
        opener = undefined;
    }

    function open(popup, trigger) {
        if (active === popup) return;
        // Acquire the replacement lock before releasing the previous modal's lock.
        const releaseNext = scrollLock.acquire();
        close({ restoreFocus: false });
        active = popup;
        opener = trigger;
        releaseScroll = releaseNext;
        popup.inert = false;
        if (!popup.hasAttribute('aria-label') && !popup.hasAttribute('aria-labelledby')) {
            popup.setAttribute(
                'aria-label',
                trigger?.innerText?.trim().replace(/\s+/g, ' ') || 'Form result',
            );
        }
        if (!popup.open) popup.showModal();
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
        for (const finish of pendingCloses) finish();
        transitions.forEach(([panel, duration]) => {
            panel.style.transitionDuration = duration;
        });
        closeButtons.forEach((button, index) => {
            if (closeLabels[index] === null) button.removeAttribute('aria-label');
            else button.setAttribute('aria-label', closeLabels[index]);
        });
        for (const [popup, role, modal, inert, tabIndex, label] of snapshots) {
            for (const [name, value] of [
                ['role', role],
                ['aria-modal', modal],
                ['tabindex', tabIndex],
                ['aria-label', label],
            ]) {
                if (value === null) popup.removeAttribute(name);
                else popup.setAttribute(name, value);
            }
            popup.inert = inert;
        }
    });
    return scope.destroy;
}
