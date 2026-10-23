import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import {
    getPageTransitionUrl,
    initPageTransition,
} from '../../src/js/animations/page-transition.js';

test('disabled or removed early bootstrap leaves the transition module inactive', () => {
    assert.equal(initPageTransition({ defaultView: {} }), undefined);
    assert.equal(
        initPageTransition({ defaultView: { framePageTransition: { enabled: false } } }),
        undefined,
    );
});

const current = 'https://example.com/publications/';
const click = { button: 0 };
function anchor(href, attributes = {}) {
    const values = { href, ...attributes };
    return {
        getAttribute: (name) => values[name] ?? null,
        hasAttribute: (name) => Object.hasOwn(values, name),
        relList: { contains: (value) => (values.rel || '').split(' ').includes(value) },
    };
}

test('ordinary internal documents animate; hashes, external and special links stay native', () => {
    assert.equal(
        getPageTransitionUrl(anchor('/about/?page=2'), click, current),
        'https://example.com/about/?page=2',
    );
    for (const href of [
        '#seo',
        '/publications/#top',
        '/publications/',
        'https://other.test/',
        'mailto:a@example.com',
        'tel:+123',
        '/wp-admin/',
        '/wp-login.php',
        '/report.pdf',
        '/file.zip',
        'http://[',
    ]) {
        assert.equal(getPageTransitionUrl(anchor(href), click, current), null, href);
    }
    for (const attributes of [
        { target: '_blank' },
        { target: 'preview' },
        { download: '' },
        { 'data-no-transition': '' },
        { 'data-open-popup': 'contact-me' },
        { rel: 'external' },
    ]) {
        assert.equal(getPageTransitionUrl(anchor('/about/', attributes), click, current), null);
    }
});

test('modified, non-primary and already handled clicks are never intercepted', () => {
    for (const event of [
        { button: 1 },
        { button: 2 },
        { button: 0, ctrlKey: true },
        { button: 0, metaKey: true },
        { button: 0, shiftKey: true },
        { button: 0, altKey: true },
        { button: 0, defaultPrevented: true },
    ]) {
        assert.equal(getPageTransitionUrl(anchor('/about/'), event, current), null);
    }
});

const bootstrap = readFileSync(
    new URL('../../template-parts/page-transition.php', import.meta.url),
    'utf8',
).match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(record, { reduced = false, blocked = false } = {}) {
    const state = { removed: false, consumed: false, events: [], fallback: null, appended: false };
    const canvas = {
        style: {},
        dataset: {},
        setAttribute() {},
        getContext: () => ({ fillRect() {} }),
        remove() {
            state.removed = true;
        },
    };
    const window = {};
    runInNewContext(bootstrap, {
        window,
        URL,
        Event,
        Date,
        location: new URL(current),
        matchMedia: () => ({ matches: reduced }),
        sessionStorage: {
            getItem() {
                if (blocked) throw new Error('storage denied');
                return JSON.stringify(record);
            },
            removeItem() {
                state.consumed = true;
            },
        },
        document: {
            createElement: () => canvas,
            documentElement: {
                append() {
                    state.appended = true;
                },
            },
            dispatchEvent(event) {
                state.events.push(event.type);
            },
        },
        setTimeout(callback) {
            state.fallback = callback;
        },
    });
    return { ...state, window, state };
}

test('destination is covered before the app runs and fallback releases a failed bundle', () => {
    const { window, state } = boot({ url: current, at: Date.now() });
    assert.equal(window.framePageTransition.pending, true);
    assert.equal(state.appended, true);
    assert.equal(state.consumed, true);
    state.fallback();
    assert.equal(state.removed, true);
    assert.equal(window.framePageTransition.pending, false);
    assert.deepEqual(state.events, ['frame:page-reveal']);
});

test('stale, unrelated, reduced-motion and storage-denied loads remain uncovered', () => {
    for (const [record, options] of [
        [null, {}],
        [{ url: current, at: Date.now() - 20000 }, {}],
        [{ url: current, at: Date.now() + 20000 }, {}],
        [{ url: current }, {}],
        [{ url: 'https://example.com/about/', at: Date.now() }, {}],
        [{ url: 'https://other.test/publications/', at: Date.now() }, {}],
        [{ url: current, at: Date.now() }, { reduced: true }],
        [{ url: current, at: Date.now() }, { blocked: true }],
    ]) {
        const { window, state } = boot(record, options);
        assert.equal(window.framePageTransition.pending, false);
        assert.equal(state.appended, false);
    }
});
