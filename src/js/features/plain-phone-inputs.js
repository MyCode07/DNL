import { createScope } from '../core/lifecycle.js';
import { sanitizePhoneValue } from '../utils/phone-value.js';

export function initPlainPhoneInputs(form) {
    const scope = createScope();
    for (const field of form.querySelectorAll(
        'input[type="tel"], input[type="text"][name="phone"]',
    )) {
        if (field.disabled || field.closest('.novalidate') || field.name.includes('honeypot'))
            continue;
        const originalType = field.getAttribute('type');
        field.type = 'tel';
        function sanitize() {
            const value = field.value;
            const next = sanitizePhoneValue(value);
            if (value === next) return;
            const start = field.selectionStart;
            const end = field.selectionEnd;
            field.value = next;
            if (start !== null && end !== null) {
                field.setSelectionRange(
                    sanitizePhoneValue(value.slice(0, start)).length,
                    sanitizePhoneValue(value.slice(0, end)).length,
                );
            }
        }
        // Capture runs before the form's validation, including for pasted values.
        scope.on(field, 'input', sanitize, { capture: true });
        scope.on(field, 'change', sanitize, { capture: true });
        sanitize();
        scope.add(() => {
            if (originalType === null) field.removeAttribute('type');
            else field.setAttribute('type', originalType);
        });
    }
    return scope.destroy;
}
