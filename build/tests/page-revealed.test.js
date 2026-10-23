import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { whenPageRevealed } from '../../src/js/utils/page-revealed.js';
import { ELEMENT_REVEAL_TARGETS } from '../../src/js/animations/element-reveal.js';

test('readiness waits for release and late subscribers do not lose it', async () => {
    const root = new EventTarget();
    root.defaultView = { framePageTransition: { pending: true } };
    let ready = false;
    const pending = whenPageRevealed(root).then(() => {
        ready = true;
    });
    root.dispatchEvent(new Event('frame:page-reveal'));
    await Promise.resolve();
    assert.equal(ready, false);
    root.defaultView.framePageTransition.pending = false;
    root.dispatchEvent(new Event('frame:page-reveal'));
    await pending;
    assert.equal(ready, true);
    await whenPageRevealed(root);
});

test('removed canvas and aborted consumers do not wait', async () => {
    await whenPageRevealed({});
    const root = new EventTarget();
    root.defaultView = { framePageTransition: { pending: true } };
    const controller = new AbortController();
    const pending = whenPageRevealed(root, controller.signal);
    controller.abort();
    await pending;
    await whenPageRevealed(root, controller.signal);
});

test('early CSS and JS cover exactly the same reveal targets', () => {
    const scss = readFileSync(
        new URL('../../src/scss/animations/_element-reveal.scss', import.meta.url),
        'utf8',
    );
    const selectors = [...scss.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(selectors, ELEMENT_REVEAL_TARGETS.split(', '));
});
