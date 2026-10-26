import assert from 'node:assert/strict';
import test from 'node:test';
import { initHeader } from '../../src/js/features/header.js';

test('header switches at its leading edge in both scroll directions', (t) => {
    const viewport = new EventTarget();
    Object.assign(viewport, { scrollY: 0, innerHeight: 800, innerWidth: 1440 });
    let pendingFrame;
    const originalRequest = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = (callback) => {
        pendingFrame = callback;
        return 1;
    };
    globalThis.cancelAnimationFrame = () => {};
    const originalWindow = globalThis.window;
    globalThis.window = viewport;
    t.after(() => {
        destroy();
        if (originalRequest === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = originalRequest;
        if (originalCancel === undefined) delete globalThis.cancelAnimationFrame;
        else globalThis.cancelAnimationFrame = originalCancel;
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
    });
    const classes = () => {
        const values = new Set();
        return {
            contains: (name) => values.has(name),
            add: (name) => values.add(name),
            remove: (name) => values.delete(name),
            toggle: (name, enabled) => (enabled ? values.add(name) : values.delete(name)),
        };
    };
    const header = {
        className: 'header',
        classList: classes(),
        getBoundingClientRect: () => ({ top: 40, bottom: 104 }),
    };
    const button = { classList: classes() };
    const section = {
        getBoundingClientRect: () => ({
            top: 300 - viewport.scrollY,
            bottom: 600 - viewport.scrollY,
        }),
    };
    const destroy = initHeader({
        querySelector: (selector) => (selector === '.header' ? header : button),
        querySelectorAll: () => [section],
    });
    const check = (scrollY, dark, event = 'scroll') => {
        viewport.scrollY = scrollY;
        viewport.dispatchEvent(new Event(event));
        pendingFrame();
        assert.equal(header.classList.contains('dark'), dark, `dark at ${scrollY}, ${event}`);
        assert.equal(button.classList.contains('_btn-black'), dark);
        assert.equal(button.classList.contains('_btn-white'), !dark);
    };
    check(195.5, false);
    check(196, true);
    check(495.5, true);
    check(496, false);
    check(600, false);
    check(560.5, false);
    check(560, true);
    check(560, true, 'resize');
    check(260.5, true);
    check(260, false);
    check(261, true);
});
