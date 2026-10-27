import assert from 'node:assert/strict';
import test from 'node:test';
import {
    isFieldValid,
    isRequiredField,
    getFormFields,
    getFieldErrorMessage,
    registerPhoneValidator,
} from '../../src/js/utils/form-validation.js';

test('field errors use Russian only for the Russian HTML language', () => {
    for (const language of ['ru', 'ru-RU', 'RU-ru'])
        assert.equal(getFieldErrorMessage(language), 'Поле заполнено неверно');
    for (const language of ['en', 'en-US', 'hy', 'de', ''])
        assert.equal(getFieldErrorMessage(language), 'The field is filled out incorrectly');
});

function field(overrides = {}) {
    const { required = false, acceptance, ...attributes } = overrides;
    return {
        name: 'name',
        type: 'text',
        value: '',
        disabled: false,
        minLength: -1,
        maxLength: 400,
        validity: { valid: true },
        matches: (selector) => selector.includes('[required]') && required,
        closest: (selector) => (selector === '.wpcf7-acceptance' ? acceptance || null : null),
        ...attributes,
    };
}

test('required text rejects blank and one character, accepts trimmed Unicode text', () => {
    const input = field({ required: true });
    for (const value of ['', '   ', ' Я ']) {
        input.value = value;
        assert.equal(isFieldValid(input, [input]), false);
    }
    input.value = ' Анна ';
    assert.equal(isFieldValid(input, [input]), true);
});

test('optional text may be empty but filled values need two characters', () => {
    const input = field();
    assert.equal(isFieldValid(input, [input]), true);
    input.value = 'A';
    assert.equal(isFieldValid(input, [input]), false);
    input.value = 'AB';
    assert.equal(isFieldValid(input, [input]), true);
});

test('email must have a valid format and satisfy native constraints', () => {
    const input = field({ type: 'email', required: true });
    for (const value of ['test', 'test@', 'test@example', 'a b@example.com']) {
        input.value = value;
        assert.equal(isFieldValid(input, [input]), false);
    }
    input.value = 'test@example.com';
    assert.equal(isFieldValid(input, [input]), true);
    input.validity.valid = false;
    assert.equal(isFieldValid(input, [input]), false);
});

test('required checkbox groups accept any checked item, scoped to the form fields', () => {
    const first = field({ name: 'options[]', type: 'checkbox', required: true, checked: false });
    const second = field({ name: 'options[]', type: 'checkbox', checked: true });
    assert.equal(isFieldValid(first, [first, second]), true);
    assert.equal(isFieldValid(first, [first]), false);
});

test('CF7 acceptance honors optional and inverted settings', () => {
    const classes = new Set();
    const input = field({
        type: 'checkbox',
        checked: false,
        acceptance: {
            classList: { contains: (name) => classes.has(name) },
        },
    });
    assert.equal(isRequiredField(input), true);
    assert.equal(isFieldValid(input, [input]), false);
    classes.add('invert');
    assert.equal(isFieldValid(input, [input]), true);
    classes.add('optional');
    assert.equal(isRequiredField(input), false);
    assert.equal(isFieldValid(input, [input]), true);
});

test('budget is optional, accepts either value and rejects short custom text', () => {
    const radio = field({ type: 'radio', name: 'budget', value: '100000', checked: false });
    const custom = field({ name: 'budget_custom' });
    const budget = { radios: [radio], custom };
    const valid = () =>
        [radio, custom].every((input) => isFieldValid(input, [radio, custom], budget));
    assert.equal(valid(), true);
    radio.checked = true;
    assert.equal(valid(), true);
    radio.checked = false;
    custom.value = '1';
    assert.equal(valid(), false);
    custom.value = '200000';
    assert.equal(valid(), true);
});

test('CF7 radio is required even without an aria-required attribute', () => {
    const input = field({ type: 'radio', checked: false });
    assert.equal(isRequiredField(input), true);
    assert.equal(isFieldValid(input, [input]), false);
});

test('service, disabled and honeypot fields never block form validation', () => {
    const input = field();
    const hidden = field({ type: 'hidden' });
    const disabled = field({ disabled: true });
    const honeypot = field({ matches: (selector) => selector.includes('honeypot') });
    const form = { querySelectorAll: () => [input, hidden, disabled, honeypot] };
    assert.deepEqual(getFormFields(form), [input]);
});

for (const name of ['cname', 'location']) {
    test(`${name} allows international letters and separators, rejects numbers and limits length to 40`, () => {
        const input = field({ name });
        for (const value of [
            'Анна-Мария',
            'O’Connor',
            'N’Djamena',
            'Հայաստան',
            'São Paulo',
            'Jose\u0301',
            'United States',
            'А'.repeat(40),
        ]) {
            input.value = value;
            assert.equal(isFieldValid(input, [input]), true, value);
        }
        for (const value of [
            'Иван2',
            'Paris ٢',
            'Москва!',
            'John@example',
            '-----',
            '😀 City',
            'А'.repeat(41),
        ]) {
            input.value = value;
            assert.equal(isFieldValid(input, [input]), false, value);
        }
        input.value = '';
        assert.equal(isFieldValid(input, [input]), true);
    });
}

test('telephone accepts digits and an optional leading plus without requiring a country code', () => {
    const input = field({ type: 'tel', value: '+14155552671' });
    assert.equal(isFieldValid(input, [input]), true);
    const unregister = registerPhoneValidator(input, () => false);
    assert.equal(isFieldValid(input, [input]), false);
    unregister();
    assert.equal(isFieldValid(input, [input]), true);
    for (const value of ['123', '4155552671', '+00000000000', '+1234567890123456']) {
        input.value = value;
        assert.equal(isFieldValid(input, [input]), true, value);
    }
    for (const value of ['+', '12+34', '++123', '+1 letters', '+1 (415) 555-2671']) {
        input.value = value;
        assert.equal(isFieldValid(input, [input]), false, value);
    }
});
