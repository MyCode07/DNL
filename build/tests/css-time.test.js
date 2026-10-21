import assert from 'node:assert/strict';
import test from 'node:test';
import { cssTimeToSeconds } from '../../src/js/utils/css-time.js';

test('source and minified CSS durations produce the same animation time', () => {
    assert.equal(cssTimeToSeconds('800ms'), 0.8);
    assert.equal(cssTimeToSeconds('.8s'), 0.8);
    assert.equal(cssTimeToSeconds(' 0.8s '), 0.8);
});

test('reduced-motion durations remain zero in either unit', () => {
    assert.equal(cssTimeToSeconds('0ms'), 0);
    assert.equal(cssTimeToSeconds('0s'), 0);
});
