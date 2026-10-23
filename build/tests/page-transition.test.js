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
        '/about/#team',
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
function boot(
    record,
    { reduced = false, blocked = false, contextError = false, noContext = false } = {},
) {
    const state = { removed: false, consumed: false, events: [], fallback: null, appended: false };
    const canvas = {
        style: {},
        dataset: {},
        setAttribute() {},
        getContext: () => {
            if (contextError) throw new Error('Canvas unavailable');
            return noContext ? null : { fillRect() {} };
        },
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
                if (blocked) throw new Error('storage denied');
                state.consumed = true;
            },
        },
        document: {
            createElement: () => canvas,
            documentElement: {
                classList: { add() {} },
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

test('first loads, reloads and unavailable storage still receive an entrance', () => {
    for (const options of [{}, { blocked: true }]) {
        const { window, state } = boot(null, options);
        assert.equal(window.framePageTransition.pending, true);
        assert.equal(state.appended, true);
    }
});

test('reduced motion and unsupported or throwing canvas remain uncovered', () => {
    for (const options of [{ reduced: true }, { noContext: true }, { contextError: true }]) {
        const { window, state } = boot(null, options);
        assert.equal(window.framePageTransition.pending, false);
        assert.equal(state.appended, false);
        state.fallback();
        assert.equal(window.framePageTransition.pending, false);
    }
});

// Exercise the real GSAP completion callbacks with a small DOM/event fixture.
const { gsap } = await import('../../src/js/core/gsap.js');
function transitionFixture({ blocked = false, broken = false } = {}) {
    const root = new EventTarget();
    const view = new EventTarget();
    const motion = new EventTarget();
    motion.matches = false;
    const timers = new Map();
    let nextTimer = 0;
    const assigned = [];
    const canvas = {
        style: {},
        dataset: {},
        removed: false,
        setAttribute() {},
        remove() {
            this.removed = true;
        },
        getContext() {
            if (broken) throw new Error('canvas unavailable');
            return { clearRect() {}, fillRect() {} };
        },
    };
    class Link {
        closest() {
            return this;
        }
        getAttribute(name) {
            return name === 'href' ? '/about/' : null;
        }
        hasAttribute() {
            return false;
        }
    }
    Object.assign(view, {
        innerWidth: 1280,
        innerHeight: 800,
        devicePixelRatio: 2,
        Element: Link,
        matchMedia: () => motion,
        location: { href: current, assign: (url) => assigned.push(url) },
        sessionStorage: {
            setItem() {
                if (blocked) throw new Error('storage blocked');
            },
            removeItem() {},
        },
        setTimeout: (callback) => {
            const id = ++nextTimer;
            timers.set(id, callback);
            return id;
        },
        clearTimeout: (id) => timers.delete(id),
    });
    const bridge = (view.framePageTransition = {
        enabled: true,
        pending: true,
        cover: canvas,
        release() {
            this.pending = false;
            root.dispatchEvent(new Event('frame:page-reveal'));
        },
    });
    Object.assign(root, {
        defaultView: view,
        fonts: { ready: Promise.resolve() },
        createElement: () => {
            canvas.removed = false;
            return canvas;
        },
        documentElement: { append() {} },
    });
    const clickLink = () => {
        const event = new Event('click', { cancelable: true });
        Object.defineProperties(event, { button: { value: 0 }, target: { value: new Link() } });
        root.dispatchEvent(event);
        return event.defaultPrevented;
    };
    return { root, view, bridge, canvas, timers, assigned, clickLink };
}
const transitionTween = (progress) =>
    gsap.globalTimeline.getChildren().find((t) => t.vars.progress === progress);

test('opening releases only after canvas removal; closing navigates only at full coverage', async () => {
    const fixture = transitionFixture();
    let releaseCanvas;
    fixture.root.addEventListener('frame:page-reveal', () => {
        releaseCanvas = fixture.bridge.cover;
    });
    const destroy = initPageTransition(fixture.root);
    await Promise.resolve();
    assert.equal(fixture.bridge.pending, true);
    transitionTween(0).progress(0.5);
    assert.equal(fixture.bridge.pending, true);
    transitionTween(0).progress(1);
    assert.equal(fixture.bridge.pending, false);
    assert.equal(releaseCanvas, null);
    assert.equal(fixture.canvas.removed, true);
    assert.equal(fixture.clickLink(), true);
    assert.equal(fixture.clickLink(), true);
    assert.deepEqual(fixture.assigned, []);
    transitionTween(1).progress(0.5);
    assert.deepEqual(fixture.assigned, []);
    transitionTween(1).progress(1);
    assert.deepEqual(fixture.assigned, ['https://example.com/about/']);
    // Simulate the watchdog after a cancelled navigation.
    [...fixture.timers.values()].forEach((callback) => callback());
    assert.equal(fixture.bridge.cover, null);
    destroy();
    assert.equal(fixture.timers.size, 0);
    assert.equal(fixture.clickLink(), false);
});

test('cached pages reopen without releasing queued reveals between covers', async () => {
    const fixture = transitionFixture();
    const destroy = initPageTransition(fixture.root);
    await Promise.resolve();
    let releases = 0;
    fixture.root.addEventListener('frame:page-reveal', () => releases++);
    const event = new Event('pageshow');
    Object.defineProperty(event, 'persisted', { value: true });
    fixture.view.dispatchEvent(event);
    assert.equal(releases, 0);
    assert.equal(fixture.bridge.pending, true);
    transitionTween(0).progress(1);
    assert.equal(releases, 1);
    assert.equal(fixture.bridge.cover, null);
    destroy();
});

test('blocked storage and failing canvas preserve native links and release reveals', async () => {
    for (const options of [{ blocked: true }, { broken: true }]) {
        const fixture = transitionFixture(options);
        const destroy = initPageTransition(fixture.root);
        await Promise.resolve();
        transitionTween(0)?.progress(1);
        assert.equal(fixture.bridge.pending, false);
        assert.equal(fixture.clickLink(), false);
        assert.equal(fixture.bridge.cover, null);
        destroy();
    }
    gsap.ticker.sleep();
});
