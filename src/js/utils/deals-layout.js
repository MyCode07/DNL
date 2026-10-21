/** Scroll only as far as needed to reveal the active card, without trailing empty space. */
export function getDealsOffset(offset, left, width, viewportWidth, contentWidth) {
    const max = Math.max(0, contentWidth - viewportWidth);
    return Math.min(
        max,
        Math.max(0, Math.min(left, Math.max(offset, left + width - viewportWidth))),
    );
}
