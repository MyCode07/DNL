import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getRevealDelay } from '../../src/js/utils/reveal-delay.js';
import { ELEMENT_REVEAL_TARGETS } from '../../src/js/animations/element-reveal.js';

function documentFixture(value, { started = 100, now = 400, container = true } = {}) {
    return {
        querySelector: () => (container ? { getAttribute: () => value } : null),
        defaultView: { frameRevealStartedAt: started, performance: { now: () => now } },
    };
}

test('the data attribute controls the remaining delay from early page opening', () => {
    assert.equal(getRevealDelay(documentFixture('1200')), 900);
    assert.equal(getRevealDelay(documentFixture('600')), 300);
    assert.equal(getRevealDelay(documentFixture('1200', { now: 1500 })), 0);
    assert.equal(getRevealDelay(documentFixture('1200', { started: null })), 1200);
});

test('missing or invalid delay never introduces a hardcoded wait', () => {
    for (const value of [null, undefined, '', ' ', '0', '-1', 'bad', 'Infinity']) {
        assert.equal(getRevealDelay(documentFixture(value)), 0, String(value));
    }
    assert.equal(getRevealDelay(documentFixture('1200', { container: false })), 0);
});

test('early CSS and JS cover exactly the same reveal targets', () => {
    const scss = readFileSync(
        new URL('../../src/scss/animations/_element-reveal.scss', import.meta.url),
        'utf8',
    );
    const selectors = [...scss.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(selectors, ELEMENT_REVEAL_TARGETS.split(', '));
});
