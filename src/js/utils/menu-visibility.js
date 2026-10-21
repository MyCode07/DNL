/** Opening the menu overrides scroll visibility on every screen size. */
export function isProjectVisible({ open, mobile, compact, scrolled, innerPage }) {
    return open || (!mobile && !compact && !scrolled && !innerPage);
}
