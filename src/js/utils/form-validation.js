const requiredSelector = '[required], [aria-required="true"], .wpcf7-validates-as-required';
const phoneValidators = new WeakMap();
const alphabeticNames = new Set(['cname', 'location']);

export function registerPhoneValidator(field, validate) {
    phoneValidators.set(field, validate);
    return () => phoneValidators.delete(field);
}

export function isAlphabeticField(field) {
    return alphabeticNames.has(field.name);
}

export function isAlphabeticValue(value) {
    return /^[\p{L}\p{M}\p{Zs}'’ʼ‐‑-]+$/u.test(value) && /\p{L}/u.test(value);
}

export function getFieldErrorMessage(messages, field) {
    const value = field.value.trim();
    let key = 'validation_error';
    if (field.closest('.wpcf7-acceptance')) key = 'accept_terms';
    else if (!value || ['checkbox', 'radio'].includes(field.type)) key = 'invalid_required';
    else if (
        (isAlphabeticField(field) && [...value].length > 40) ||
        (field.maxLength >= 0 && value.length > field.maxLength)
    )
        key = 'invalid_too_long';
    else if (
        (field.minLength > 0 && [...value].length < field.minLength) ||
        (['text', 'search', 'tel', 'url', 'textarea'].includes(field.type) && [...value].length < 2)
    )
        key = 'invalid_too_short';
    else if (isAlphabeticField(field) && !isAlphabeticValue(value)) key = 'invalid_alphabetic';
    else if (field.type === 'tel') key = 'invalid_tel';
    else if (field.type === 'email') key = 'invalid_email';
    else if (field.type === 'url') key = 'invalid_url';
    return messages[key] || messages.validation_error || '';
}

export function getFormFields(form) {
    return [...form.querySelectorAll('input, textarea, select')].filter(
        (field) =>
            !field.disabled &&
            !['hidden', 'submit', 'button', 'reset', 'image'].includes(field.type) &&
            !field.matches('[name*="honeypot"], .wpcf7_hp_field') &&
            !field.closest('[hidden], .novalidate'),
    );
}

export function isRequiredField(field) {
    const acceptance = field.closest('.wpcf7-acceptance');
    if (acceptance) return !acceptance.classList.contains('optional');
    return (
        Boolean(field.matches(requiredSelector) || field.closest(requiredSelector)) ||
        field.type === 'radio'
    );
}

export function getBudgetFields(form) {
    const custom = form.querySelector('[name="budget_custom"]');
    const radios = [...form.querySelectorAll('input[type="radio"][name="budget"]')];
    return custom && radios.length ? { custom, radios } : null;
}

export function isFieldValid(field, fields, budget) {
    const value = field.value.trim();
    if (budget?.radios.includes(field)) return true;
    if (['checkbox', 'radio'].includes(field.type)) {
        const group = fields.filter((item) => item.name === field.name && item.type === field.type);
        const acceptance = field.closest('.wpcf7-acceptance');
        if (acceptance && !acceptance.classList.contains('optional'))
            return acceptance.classList.contains('invert') ? !field.checked : field.checked;
        return !group.some(isRequiredField) || group.some((item) => item.checked);
    }
    if (!value) return !isRequiredField(field);
    if (isAlphabeticField(field) && ([...value].length > 40 || !isAlphabeticValue(value)))
        return false;
    if (field.type === 'tel') {
        const validate = phoneValidators.get(field);
        if (validate ? !validate() : !/^\+?[0-9]+$/.test(value)) return false;
    }
    if (['text', 'search', 'tel', 'url', 'textarea'].includes(field.type) && [...value].length < 2)
        return false;
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
    if (field.minLength > 0 && [...value].length < field.minLength) return false;
    if (field.maxLength >= 0 && value.length > field.maxLength) return false;
    return field.validity.valid;
}

export function getFieldContainer(field) {
    return (
        field.closest('.form__item, .form__checkboxes-text, .form__checkboxes, .form__privacy') ||
        field.closest('.wpcf7-form-control-wrap')?.parentElement ||
        field.parentElement
    );
}
