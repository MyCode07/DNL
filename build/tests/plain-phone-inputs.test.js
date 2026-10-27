import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizePhoneValue } from '../../src/js/utils/phone-value.js';
import { initPlainPhoneInputs } from '../../src/js/features/plain-phone-inputs.js';

test('phone typing and pasted text retain only digits and one leading plus', () => {
    for (const [input, expected] of [
        ['', ''],
        ['+', '+'],
        ['012345', '012345'],
        ['+012345', '+012345'],
        ['++44 (20) 7946-0018', '+442079460018'],
        ['12+34', '1234'],
        ['abc123', '123'],
        ['abc+123', '123'],
        ['１２٣123', '123'],
    ])
        assert.equal(sanitizePhoneValue(input), expected, input);
});

test('plain phone listeners sanitize before validation, retain the caret and clean up', () => {
    class Field extends EventTarget {
        value = '';
        type = 'text';
        name = 'phone';
        selectionStart = 0;
        selectionEnd = 0;
        getAttribute() {
            return 'text';
        }
        setAttribute(name, value) {
            this[name] = value;
        }
        closest() {
            return null;
        }
        setSelectionRange(start, end) {
            this.selectionStart = start;
            this.selectionEnd = end;
        }
    }
    const input = new Field();
    const destroy = initPlainPhoneInputs({ querySelectorAll: () => [input] });
    assert.equal(input.type, 'tel');
    input.value = '+12x345';
    input.selectionStart = input.selectionEnd = 4;
    input.dispatchEvent(new Event('input'));
    assert.equal(input.value, '+12345');
    assert.equal(input.selectionStart, 3);
    input.value = '12+34 letters';
    input.dispatchEvent(new Event('change'));
    assert.equal(input.value, '1234');
    destroy();
    assert.equal(input.type, 'text');
    input.value = 'letters';
    input.dispatchEvent(new Event('input'));
    assert.equal(input.value, 'letters');
});
