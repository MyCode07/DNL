import { createScope } from '../core/lifecycle.js';
import { getFocusableElements, trapFocus } from '../utils/focus.js';

/** One active modal, delegated triggers, keyboard dismissal and restored focus. */
export function initPopups(root) {
    const scope = createScope();
    const popups = [...root.querySelectorAll('.popup')];
    const panels = new Map(
        popups.map((popup) => [popup, popup.querySelector('.popup-panel') || popup]),
    );
    let active;
    let opener;
    const blocked = new Set();
    const pendingCloses = new Map();

    function afterClose(popup, done) {
        const animations = panels.get(popup).getAnimations();
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

    function close({ restoreFocus = true } = {}) {
        if (!active) return;
        const activePopup = active;
        active.classList.remove('_open');
        active.inert = true;
        active.dispatchEvent(new CustomEvent('popup:close', { bubbles: true }));
        active = undefined;
        for (const element of blocked) element.inert = false;
        blocked.clear();
        const previousOpener = opener;
        afterClose(activePopup, () => {
            activePopup.hidden = true;
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
        popup.hidden = false;
        for (let node = popup; node !== popup.ownerDocument.body; node = node.parentElement) {
            for (const sibling of node.parentElement.children) {
                if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert)
                    continue;
                sibling.inert = true;
                blocked.add(sibling);
            }
        }
        // Establish the initial position before the opening transition.
        const panel = panels.get(popup);
        panel.getBoundingClientRect();
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
    scope.on(root, 'keydown', (event) => {
        if (!active) return;
        if (event.key === 'Escape' && !event.defaultPrevented) {
            event.preventDefault();
            close();
        } else {
            trapFocus(event, active);
        }
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
