import { createScope } from '../core/lifecycle.js';
import { getFocusableElements, trapFocus } from '../utils/focus.js';

/** One active modal, delegated triggers, keyboard dismissal and restored focus. */
export function initPopups(root, scrollLock, media) {
    const scope = createScope();
    const popups = [...root.querySelectorAll('.popup')];
    const snapshots = popups.map((popup) => [
        popup,
        popup.getAttribute('role'),
        popup.getAttribute('aria-modal'),
        popup.inert,
        popup.getAttribute('tabindex'),
        popup.getAttribute('aria-label'),
    ]);
    const transitions = popups.map((popup) => [popup, popup.style.transitionDuration]);
    const closeButtons = [...root.querySelectorAll('.popup-close')];
    const closeLabels = closeButtons.map((button) => button.getAttribute('aria-label'));
    const closeLabel = root.querySelector('.menu-toggle span')?.dataset.textClose || 'Close dialog';
    closeButtons.forEach((button) => {
        if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', closeLabel);
    });
    function updateMotion() {
        transitions.forEach(([popup, duration]) => {
            popup.style.transitionDuration = media.reducedMotion.matches ? '0s' : duration;
        });
    }
    updateMotion();
    scope.on(media.reducedMotion, 'change', updateMotion);
    let active;
    let opener;
    let releaseScroll;
    const pendingCloses = new Set();

    function releaseAfterClose(popup, release) {
        if (!release) return;
        const animations = popup.getAnimations();
        if (!animations.length) {
            release();
            return;
        }
        const finish = () => {
            if (!pendingCloses.delete(finish)) return;
            release();
        };
        pendingCloses.add(finish);
        // CSS owns the duration; cancellation (reopening or reduced motion) also settles it.
        Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
    }

    for (const popup of popups) {
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-modal', 'true');
        popup.setAttribute('tabindex', '-1');
        popup.inert = true;
    }

    function close({ restoreFocus = true } = {}) {
        if (!active) return;
        const activePopup = active;
        active.classList.remove('_open');
        active.inert = true;
        active.dispatchEvent(new CustomEvent('popup:close', { bubbles: true }));
        active = undefined;
        releaseAfterClose(activePopup, releaseScroll);
        releaseScroll = undefined;
        if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
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
                trigger.innerText?.trim().replace(/\s+/g, ' ') || 'Form result',
            );
        }
        popup.classList.add('_open');
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
    scope.on(root, 'keydown', (event) => {
        if (!active) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else trapFocus(event, active);
    });
    scope.add(() => {
        close();
        for (const finish of pendingCloses) finish();
        transitions.forEach(([popup, duration]) => {
            popup.style.transitionDuration = duration;
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
