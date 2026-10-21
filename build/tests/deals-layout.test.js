import assert from 'node:assert/strict';
import test from 'node:test';
import { getDealsOffset } from '../../src/js/utils/deals-layout.js';

test('visible cards stay in place and an overflowing active card aligns to the right', () => {
    assert.equal(getDealsOffset(0, 500, 480, 1220, 1500), 0);
    assert.equal(getDealsOffset(0, 840, 480, 1220, 1500), 100);
});

test('returning to an earlier card brings its left edge into view', () => {
    assert.equal(getDealsOffset(1100, 340, 480, 1220, 2600), 340);
    assert.equal(getDealsOffset(340, 0, 480, 1220, 2600), 0);
});

test('any number of cards can reach the last item without blank space on the right', () => {
    assert.equal(getDealsOffset(0, 2040, 480, 1220, 2520), 1300);
    assert.equal(getDealsOffset(3000, 2040, 480, 1220, 2520), 1300);
    assert.equal(getDealsOffset(100, 0, 480, 1220, 480), 0);
});

test('full-width mobile cards move one viewport plus the CSS gap', () => {
    assert.equal(getDealsOffset(0, 344, 328, 328, 1360), 344);
    assert.equal(getDealsOffset(344, 1032, 328, 328, 1360), 1032);
    assert.equal(getDealsOffset(1032, 0, 328, 328, 1360), 0);
});
