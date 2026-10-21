/** Convert a CSS time value to seconds for JavaScript animation libraries. */
export function cssTimeToSeconds(value) {
    const time = value.trim();
    return parseFloat(time) / (time.endsWith('ms') ? 1000 : 1);
}
