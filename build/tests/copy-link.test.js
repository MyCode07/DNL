import assert from 'node:assert/strict';
import test from 'node:test';
import { initCopyLinks } from '../../src/js/features/copy-link.js';

function fixture(writeText) {
    const button = new EventTarget();
    button.getAttribute = () => 'https://example.com/article/';
    const classes = new Set();
    const notification = {
        classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
    };
    let prompted;
    const root = {
        querySelectorAll: () => [button],
        querySelector: () => notification,
        defaultView: {
            navigator: { clipboard: { writeText } },
            clearTimeout() {},
            prompt: (message, url) => {
                prompted = url;
            },
        },
    };
    return { root, button, classes, prompted: () => prompted };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('clipboard failure offers manual copy without displaying success', async () => {
    const state = fixture(async () => {
        throw new Error('Permission denied');
    });
    const destroy = initCopyLinks(state.root);
    state.button.dispatchEvent(new Event('click'));
    await settle();
    assert.equal(state.prompted(), 'https://example.com/article/');
    assert.ok(!state.classes.has('_active'));
    destroy();
});
