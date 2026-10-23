/** The data value is measured from the early head script, alongside the CSS page opening. */
export function getRevealDelay(root) {
    const value = root.querySelector('.page-transition')?.getAttribute('data-reveal-delay');
    if (value === null || value === undefined || value.trim() === '') return 0;
    const duration = Number(value);
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const view = root.defaultView;
    const started = view.frameRevealStartedAt;
    const elapsed = Number.isFinite(started) ? Math.max(0, view.performance.now() - started) : 0;
    return Math.max(0, duration - elapsed);
}
