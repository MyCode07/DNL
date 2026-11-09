import assert from 'node:assert/strict';
import test from 'node:test';
import { createScope } from '../../src/js/core/lifecycle.js';
import { createScrollLock } from '../../src/js/core/scroll-lock.js';
import { isProjectVisible } from '../../src/js/utils/menu-visibility.js';
import { initPopups } from '../../src/js/features/popups.js';

function popupFixture(t) {
    const originalElement = globalThis.Element;
    class TestElement extends EventTarget {}
    globalThis.Element = TestElement;
    t.after(() => {
        if (originalElement === undefined) delete globalThis.Element;
        else globalThis.Element = originalElement;
    });
    const root = new EventTarget();
    const popup = new TestElement();
    const attributes = new Map();
    const classes = new Set();
    let animations = [];
    Object.assign(popup, {
        style: { transitionDuration: '' },
        getAttribute: (name) => attributes.get(name) ?? null,
        setAttribute: (name, value) => attributes.set(name, value),
        removeAttribute: (name) => attributes.delete(name),
        hasAttribute: (name) => attributes.has(name),
        querySelectorAll: () => [],
        getAnimations: () => animations,
        classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
        focus() {},
    });
    root.querySelectorAll = (selector) => (selector === '.popup' ? [popup] : []);
    root.querySelector = () => null;
    root.getElementById = () => popup;
    const trigger = new TestElement();
    Object.assign(trigger, {
        dataset: { openPopup: 'test' },
        innerText: 'Open',
        closest: () => trigger,
        isConnected: true,
        focus() {},
    });
    let locks = 0;
    const motion = new EventTarget();
    motion.matches = false;
    const destroy = initPopups(
        root,
        {
            acquire: () => {
                locks++;
                return () => locks--;
            },
        },
        {
            reducedMotion: motion,
        },
    );
    t.after(destroy);
    return {
        destroy,
        locks: () => locks,
        open() {
            const event = new Event('click');
            Object.defineProperty(event, 'target', { value: trigger });
            root.dispatchEvent(event);
        },
        close(finished) {
            animations = finished ? [{ finished }] : [];
            const event = new Event('keydown');
            Object.defineProperty(event, 'key', { value: 'Escape' });
            root.dispatchEvent(event);
        },
    };
}

test('popup keeps its scroll lock until the closing transition finishes', async (t) => {
    const fixture = popupFixture(t);
    const transition = Promise.withResolvers();
    fixture.open();
    fixture.close(transition.promise);
    assert.equal(fixture.locks(), 1);
    transition.resolve();
    await new Promise(setImmediate);
    assert.equal(fixture.locks(), 0);
});

test('reopening keeps its own lock when the previous close is cancelled', async (t) => {
    const fixture = popupFixture(t);
    const transition = Promise.withResolvers();
    fixture.open();
    fixture.close(transition.promise);
    fixture.open();
    transition.reject(new Error('Transition cancelled by reopening'));
    await new Promise(setImmediate);
    assert.equal(fixture.locks(), 1);
    fixture.close();
    assert.equal(fixture.locks(), 0);
});

test('popup cleanup releases pending locks once and no-animation close is immediate', async (t) => {
    const fixture = popupFixture(t);
    fixture.open();
    fixture.close();
    assert.equal(fixture.locks(), 0);
    const transition = Promise.withResolvers();
    fixture.open();
    fixture.close(transition.promise);
    fixture.destroy();
    assert.equal(fixture.locks(), 0);
    transition.resolve();
    await new Promise(setImmediate);
    assert.equal(fixture.locks(), 0);
});

test('disposing a component removes listeners and releases resources once in reverse order', () => {
    const scope = createScope();
    const target = new EventTarget();
    const events = [];
    scope.on(target, 'click', () => events.push('click'));
    scope.add(() => events.push('first'));
    scope.add(() => events.push('second'));
    target.dispatchEvent(new Event('click'));
    scope.destroy();
    scope.destroy();
    target.dispatchEvent(new Event('click'));
    assert.deepEqual(events, ['click', 'second', 'first']);
});

test('cleanup failures do not leave the remaining component resources running', () => {
    const scope = createScope();
    const events = [];
    scope.add(() => events.push('released'));
    scope.add(() => {
        throw new Error('failed disposer');
    });
    assert.throws(() => scope.destroy(), AggregateError);
    assert.deepEqual(events, ['released']);
    scope.destroy();
    scope.add(() => events.push('late registration released immediately'));
    assert.equal(events.length, 2);
});

function element(padding = '') {
    const properties = new Map(padding ? [['padding-right', [padding, 'important']]] : []);
    const classes = new Set();
    return {
        style: {
            getPropertyValue: (name) => properties.get(name)?.[0] || '',
            getPropertyPriority: (name) => properties.get(name)?.[1] || '',
            setProperty: (name, value, priority = '') => properties.set(name, [value, priority]),
            removeProperty: (name) => properties.delete(name),
            set paddingRight(value) {
                properties.set('padding-right', [value, '']);
            },
        },
        classList: {
            contains: (name) => classes.has(name),
            add: (name) => classes.add(name),
            toggle(name, force) {
                if (force) classes.add(name);
                else classes.delete(name);
            },
        },
    };
}

function scrollFixture(t) {
    const originalWindow = globalThis.window;
    const originalComputedStyle = globalThis.getComputedStyle;
    globalThis.window = { innerWidth: 1200 };
    globalThis.getComputedStyle = (item) => ({
        paddingRight: item.style.getPropertyValue('padding-right') || '0px',
    });
    t.after(() => {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
        if (originalComputedStyle === undefined) delete globalThis.getComputedStyle;
        else globalThis.getComputedStyle = originalComputedStyle;
    });
    const body = element('8px');
    const header = element('4px');
    const calls = [];
    const root = { body, documentElement: { clientWidth: 1180 }, querySelectorAll: () => [header] };
    const lock = createScrollLock(root, {
        stop: () => calls.push('stop'),
        start: () => calls.push('start'),
    });
    return { lock, body, header, calls, root };
}

test('a popup closing over an open mobile menu keeps page scrolling locked', (t) => {
    const { lock, body, header, calls } = scrollFixture(t);
    const closeMenu = lock.acquire();
    const closePopup = lock.acquire();
    assert.equal(body.style.getPropertyValue('padding-right'), '28px');
    assert.equal(header.style.getPropertyValue('padding-right'), '24px');
    closePopup();
    closePopup();
    assert.equal(body.classList.contains('_noscroll'), true);
    assert.deepEqual(calls, ['stop']);
    closeMenu();
    assert.equal(body.classList.contains('_noscroll'), false);
    assert.equal(body.style.getPropertyValue('padding-right'), '8px');
    assert.equal(header.style.getPropertyValue('padding-right'), '4px');
    assert.equal(header.style.getPropertyPriority('padding-right'), 'important');
    assert.deepEqual(calls, ['stop', 'start']);
});

test('scrollbar compensation is recalculated after resize and destroy releases all locks', (t) => {
    const { lock, root, body, calls } = scrollFixture(t);
    lock.acquire()();
    root.documentElement.clientWidth = 1200;
    body.classList.add('_noscroll');
    const release = lock.acquire();
    assert.equal(body.style.getPropertyValue('padding-right'), '8px');
    lock.destroy();
    release();
    lock.destroy();
    assert.equal(body.classList.contains('_noscroll'), true);
    assert.deepEqual(calls, ['stop', 'start', 'stop', 'start']);
});

test('an open menu shows the CTA at any scroll position; closing restores viewport policy', () => {
    const base = { open: false, mobile: false, compact: false, scrolled: false, innerPage: false };
    assert.equal(isProjectVisible(base), true);
    for (const state of [
        { scrolled: true },
        { compact: true },
        { mobile: true, compact: true },
        { innerPage: true },
    ]) {
        assert.equal(isProjectVisible({ ...base, ...state }), false);
        assert.equal(isProjectVisible({ ...base, ...state, open: true }), true);
    }

    for (const scrolled of [false, true]) {
        for (const compact of [false, true]) {
            for (const mobile of [false, true]) {
                const state = { scrolled, compact, mobile, innerPage: true };
                assert.equal(isProjectVisible({ ...state, open: false }), false);
                assert.equal(isProjectVisible({ ...state, open: true }), true);
            }
        }
    }
});
