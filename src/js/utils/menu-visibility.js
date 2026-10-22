/** Inner-page headers show the CTA only inside the open menu. */
export function isProjectVisible({ open, mobile, compact, scrolled, innerPage }) {
    return open || (!innerPage && !mobile && !compact && !scrolled);
}
