const requiredSelector = '[required], [aria-required="true"], .wpcf7-validates-as-required';

export function getFieldErrorMessage(language) {
    return /^ru(?:-|$)/i.test(language)
        ? 'Поле заполнено неверно'
        : 'The field is filled out incorrectly';
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
    if (budget && (field === budget.custom || budget.radios.includes(field))) {
        if (!budget.radios.some((radio) => radio.checked) && !budget.custom.value.trim())
            return false;
        if (field.type === 'radio') return true;
    }
    if (['checkbox', 'radio'].includes(field.type)) {
        const group = fields.filter((item) => item.name === field.name && item.type === field.type);
        const acceptance = field.closest('.wpcf7-acceptance');
        if (acceptance && !acceptance.classList.contains('optional'))
            return acceptance.classList.contains('invert') ? !field.checked : field.checked;
        return !group.some(isRequiredField) || group.some((item) => item.checked);
    }
    if (!value) return !isRequiredField(field);
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
