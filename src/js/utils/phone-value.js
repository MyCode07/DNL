/** Keep a single optional leading plus and ASCII digits, without formatting. */
export function sanitizePhoneValue(value) {
    return (value.startsWith('+') ? '+' : '') + value.replace(/[^0-9]/g, '');
}
