import assert from 'node:assert/strict';
import test from 'node:test';
import { cssTimeToSeconds } from '../../src/js/utils/css-time.js';

test('source, minified and reduced-motion CSS durations preserve animation time', () => {
    for (const [duration, expected] of [
        ['800ms', 0.8],
        ['.8s', 0.8],
        [' 0.8s ', 0.8],
        ['0ms', 0],
        ['0s', 0],
    ])
        assert.equal(cssTimeToSeconds(duration), expected, duration);
});
