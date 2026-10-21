const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

export function getFocusableElements(container) {
    return [...container.querySelectorAll(FOCUSABLE)].filter(
        (element) =>
            !element.disabled &&
            element.tabIndex >= 0 &&
            !element.closest('[inert]') &&
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden',
    );
}

/** Keep keyboard focus inside the currently active fullscreen overlay. */
export function trapFocus(event, container) {
    if (event.key !== 'Tab') return;
    const elements = getFocusableElements(container);
    const first = elements[0];
    const last = elements.at(-1);
    if (!first) {
        event.preventDefault();
        container.focus();
        return;
    }
    const active = container.ownerDocument.activeElement;
    if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        first.focus();
    }
}
