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
    let pendingTimer;
    let prompted;
    const root = {
        querySelectorAll: () => [button],
        querySelector: () => notification,
        defaultView: {
            navigator: { clipboard: { writeText } },
            setTimeout: (callback) => {
                pendingTimer = callback;
                return 1;
            },
            clearTimeout: () => {
                pendingTimer = undefined;
            },
            prompt: (message, url) => {
                prompted = url;
            },
        },
    };
    return { root, button, classes, timer: () => pendingTimer, prompted: () => prompted };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('copy shows success, resets its timer and removes listeners on cleanup', async () => {
    const urls = [];
    const state = fixture(async (url) => urls.push(url));
    const destroy = initCopyLinks(state.root);
    state.button.dispatchEvent(new Event('click'));
    await settle();
    assert.deepEqual(urls, ['https://example.com/article/']);
    assert.ok(state.classes.has('_active'));
    state.timer()();
    assert.ok(!state.classes.has('_active'));
    state.button.dispatchEvent(new Event('click'));
    await settle();
    destroy();
    assert.equal(state.timer(), undefined);
    assert.ok(!state.classes.has('_active'));
    state.button.dispatchEvent(new Event('click'));
    await settle();
    assert.equal(urls.length, 2);
});

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

test('copy resolving after cleanup cannot display a notification', async () => {
    let resolve;
    const state = fixture(
        () =>
            new Promise((done) => {
                resolve = done;
            }),
    );
    const destroy = initCopyLinks(state.root);
    state.button.dispatchEvent(new Event('click'));
    destroy();
    resolve();
    await settle();
    assert.ok(!state.classes.has('_active'));
    assert.equal(state.timer(), undefined);
});
