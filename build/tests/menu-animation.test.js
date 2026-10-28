import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../../src/js/animations/menu.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export function', 'function');

for (const mobile of [false, true]) {
    test(`menu without optional animation targets stays warning-free (mobile: ${mobile})`, () => {
        let calls = 0;
        const check = (target) => {
            assert.ok(target, 'GSAP must receive a target');
            if (Array.isArray(target))
                assert.ok(target.length, 'GSAP must receive nonempty targets');
            calls++;
        };
        const timeline = { to: check, kill() {} };
        const gsap = {
            context: () => ({ add: (callback) => callback(), revert() {} }),
            set: check,
            timeline: () => timeline,
        };
        const body = { style: {}, inert: false };
        const surface = { style: {} };
        const menu = {
            style: {},
            querySelector: (selector) =>
                ({ '.menu-body': body, '.menu-surface': surface })[selector] ?? null,
            querySelectorAll: () => [],
            closest: () => null,
            ownerDocument: { querySelector: () => null },
        };
        const toggle = { querySelector: () => null, querySelectorAll: () => [] };
        const media = {
            mobile: { matches: mobile },
            compact: { matches: mobile },
            reducedMotion: { matches: false },
        };
        const create = runInNewContext(`${source}\ncreateMenuAnimation`, { gsap });
        const animation = create(menu, { media, toggle });
        animation.reset();
        animation.animate(true);
        animation.animate(false);
        animation.destroy();
        assert.ok(calls > 0);
        assert.equal(body.inert, false);
    });
}

const projectSource = readFileSync(
    new URL('../../src/js/animations/menu-project.js', import.meta.url),
    'utf8',
)
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export function', 'function');

test('missing menu CTA leaves a callable inactive controller', () => {
    const create = runInNewContext(`${projectSource}\ncreateProjectAnimation`);
    const animation = create({ querySelector: () => null }, {});
    animation.sync();
    animation.destroy();
});

const menuSource = readFileSync(new URL('../../src/js/features/menu.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export function', 'function');

test('incomplete menu markup does not start animations or register listeners', () => {
    const init = runInNewContext(`${menuSource}\ninitMenu`);
    for (const missing of ['.menu-body', '.menu-surface']) {
        const menu = {
            querySelector: (selector) => (selector === missing ? null : {}),
            closest: () => ({}),
        };
        assert.equal(init({ querySelector: () => menu }, {}), undefined);
    }
});
