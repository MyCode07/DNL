import assert from 'node:assert/strict';
import test from 'node:test';
import { initHeader } from '../../src/js/features/header.js';

for (const transitionDirection of [null, 'down', 'up', 'empty', 'inverse-down', 'inverse-up']) {
    test(`header uses leading edge with ${transitionDirection || 'no'} pixel transition`, (t) => {
        const viewport = new EventTarget();
        Object.assign(viewport, { scrollY: 0, innerHeight: 800, innerWidth: 1600 });
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
        let headerBottom = 104;
        const header = {
            className: 'header',
            classList: classes(),
            getBoundingClientRect: () => ({ top: 40, bottom: headerBottom }),
        };
        const button = { classList: classes() };
        let blockTop = 1200;
        const hideButtonBlock = {
            getBoundingClientRect: () => ({ top: blockTop - viewport.scrollY }),
        };
        const section = {
            hasAttribute: () => true,
            getBoundingClientRect: () => ({
                top: 300 - viewport.scrollY,
                bottom: 600 - viewport.scrollY,
            }),
        };
        const plainSection = { hasAttribute: () => false };
        const inverse = transitionDirection?.startsWith('inverse');
        const up = transitionDirection?.endsWith('up');
        const transitionTop = inverse ? (up ? 300 : 540) : up ? 600 : 240;
        const transition = {
            dataset: { direction: up ? 'up' : 'down' },
            closest: () => (inverse ? section : plainSection),
            getBoundingClientRect: () => ({
                top: transitionTop - viewport.scrollY,
                bottom:
                    transitionTop + (transitionDirection === 'empty' ? 0 : 60) - viewport.scrollY,
            }),
        };
        const destroy = initHeader({
            querySelector: (selector) => {
                if (selector === '.header') return header;
                return button;
            },
            querySelectorAll: (selector) => {
                if (selector === '[data-hide-header-button]') return [hideButtonBlock];
                if (selector === '[data-dark]') return [section];
                if (selector === '[data-small-header]') return [section];
                if (selector === '[data-pixelated-scroll-transition]')
                    return transitionDirection ? [transition] : [];
                return up !== Boolean(inverse) ? [section, plainSection] : [plainSection, section];
            },
        });
        const check = (scrollY, dark, event = 'scroll') => {
            viewport.scrollY = scrollY;
            viewport.dispatchEvent(new Event(event));
            pendingFrame();
            assert.equal(header.classList.contains('dark'), dark, `dark at ${scrollY}, ${event}`);
            assert.equal(
                header.classList.contains('header-small'),
                dark && viewport.innerWidth > 1440 && viewport.innerWidth < 1780,
                `small at ${scrollY}, ${event}`,
            );
            assert.equal(button.classList.contains('_btn-black'), dark);
            assert.equal(button.classList.contains('_btn-white'), !dark);
        };
        const start = transitionDirection === 'down' ? 240 : inverse && up ? 360 : 300;
        const end = transitionDirection === 'up' ? 660 : inverse && !up ? 540 : 600;
        check(start - 104.5, false);
        check(start - 104, true);
        check(start - 100, true);
        check(end - 104.5, true);
        check(end - 104, false);
        check(end, false);
        check(end - 39.5, false);
        check(end - 40, true);
        check(end - 40, true, 'resize');
        check(start - 39.5, true);
        check(start - 40, false);
        check(start - 39, true);
        viewport.scrollY = 350;
        for (const [width, compact] of [
            [1440, false],
            [1441, true],
            [1779, true],
            [1780, false],
        ]) {
            viewport.innerWidth = width;
            viewport.dispatchEvent(new Event('resize'));
            pendingFrame();
            assert.equal(header.classList.contains('header-small'), compact);
        }
        viewport.innerWidth = 1600;
        check(700, false);
        assert.equal(header.classList.contains('header-small'), false);
        // Hide as the marked block enters, and stay hidden after it leaves above the viewport.
        for (const scrollY of [399.5, 400, 401, 1300, 400, 399.5]) {
            viewport.scrollY = scrollY;
            viewport.dispatchEvent(new Event('scroll'));
            pendingFrame();
            assert.equal(
                header.classList.contains('header-scrolled'),
                scrollY >= blockTop - viewport.innerHeight,
            );
        }
        for (const top of [600, 1400]) {
            blockTop = top;
            viewport.dispatchEvent(new Event('resize'));
            pendingFrame();
            assert.equal(
                header.classList.contains('header-scrolled'),
                viewport.scrollY >= blockTop - viewport.innerHeight,
            );
        }
        blockTop = 1200;
        viewport.scrollY = 399;
        for (const bottom of [104, 500, 200, 104]) {
            headerBottom = bottom;
            viewport.dispatchEvent(new Event('scroll'));
            pendingFrame();
            assert.equal(header.classList.contains('header-scrolled'), false);
        }
    });
}
