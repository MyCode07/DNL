import assert from 'node:assert/strict';
import test from 'node:test';
import { initPostTitleHeight } from '../../src/js/features/postTitleHeight.js';

test('slider cleanup disconnects observers and ignores pending font and resize callbacks', async (t) => {
    const previousObserver = globalThis.ResizeObserver;
    const observers = [];
    globalThis.ResizeObserver = class {
        constructor(callback) {
            this.callback = callback;
            this.disconnected = false;
            observers.push(this);
        }
        observe() {}
        disconnect() {
            this.disconnected = true;
        }
    };
    t.after(() => {
        globalThis.ResizeObserver = previousObserver;
    });
    let resolveFonts;
    const ready = new Promise((resolve) => {
        resolveFonts = resolve;
    });
    const properties = new Map();
    const titles = [20, 45].map((height) => ({ getBoundingClientRect: () => ({ height }) }));
    const slider = {
        querySelectorAll: () => titles,
        style: {
            getPropertyValue: (name) => properties.get(name) ?? '',
            getPropertyPriority: () => '',
            setProperty: (name, value) => properties.set(name, String(value)),
            removeProperty: (name) => properties.delete(name),
        },
    };
    const root = {
        fonts: { ready },
        querySelectorAll: (selector) => (selector === '.swiper' ? [slider] : []),
    };
    const destroy = initPostTitleHeight(root);
    assert.equal(properties.get('--title-height'), '45');
    assert.equal(typeof destroy, 'function');
    destroy();
    destroy();
    assert.equal(observers[0].disconnected, true);
    assert.equal(properties.has('--title-height'), false);
    observers[0].callback();
    resolveFonts();
    await ready;
    assert.equal(properties.has('--title-height'), false);
});

test('grid titles align per row, regroup at breakpoints and reset on mobile and cleanup', () => {
    const previousObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
    try {
        const titles = [20, 60, 40, 30, 50].map((height) => ({
            style: {
                removeProperty() {
                    delete this.minHeight;
                },
            },
            getBoundingClientRect: () => ({ height }),
        }));
        const grid = {
            querySelector: () => titles[0],
            querySelectorAll: () => titles,
        };
        let resize;
        const view = {
            innerWidth: 1025,
            addEventListener(name, callback) {
                resize = callback;
            },
            removeEventListener(name, callback) {
                assert.equal(callback, resize);
            },
        };
        const root = {
            defaultView: view,
            fonts: { ready: Promise.resolve() },
            querySelectorAll: (selector) => (selector === '.grid.grid-3' ? [grid] : []),
        };
        const destroy = initPostTitleHeight(root);
        const heights = () => titles.map((title) => title.style.minHeight);
        assert.deepEqual(heights(), ['60px', '60px', '60px', '50px', '50px']);
        view.innerWidth = 1024;
        resize();
        assert.deepEqual(heights(), ['60px', '60px', '40px', '40px', '50px']);
        view.innerWidth = 768;
        resize();
        assert.deepEqual(heights(), ['60px', '60px', '40px', '40px', '50px']);
        view.innerWidth = 767;
        resize();
        assert.deepEqual(heights(), Array(5).fill(undefined));
        view.innerWidth = 1200;
        resize();
        destroy();
        assert.deepEqual(heights(), Array(5).fill(undefined));
    } finally {
        globalThis.ResizeObserver = previousObserver;
    }
});
