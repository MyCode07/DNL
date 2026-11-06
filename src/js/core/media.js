// Match the existing SCSS breakpoints; animation and UI controllers share these queries.
export function createMediaQueries() {
    return {
        mobile: window.matchMedia('(max-width: 1024px)'),
        compact: window.matchMedia('(max-width: 1440px)'),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    };
}
