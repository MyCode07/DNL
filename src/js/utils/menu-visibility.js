/** Only opted-in headers show the CTA outside the open menu. */
export function isProjectVisible({ open, mobile, compact, scrolled, hideMenuBtn }) {
    return open || (hideMenuBtn && !mobile && !compact && !scrolled);
}
