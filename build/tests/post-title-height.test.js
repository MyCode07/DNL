import assert from 'node:assert/strict';
import test from 'node:test';
import { initPostTitleHeight } from '../../src/js/features/postTitleHeight.js';

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
