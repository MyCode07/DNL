import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { createScope } from '../../src/js/core/lifecycle.js';

const source = readFileSync(
    new URL('../../src/js/features/project-descriptions.js', import.meta.url),
    'utf8',
)
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export function', 'function');

function fixture(mobile = true) {
    const cards = Array.from({ length: 3 }, (_, index) => {
        const description = { id: `description-${index}`, inert: false, height: 'auto' };
        const label = { textContent: 'Original' };
        const attributes = new Map([
            ['aria-controls', description.id],
            ['aria-expanded', 'true'],
        ]);
        const button = Object.assign(new EventTarget(), {
            hidden: true,
            dataset: { textOpen: 'Read', textClose: 'Hide' },
            querySelector: () => label,
            closest: () => ({ querySelector: () => description }),
            getAttribute: (name) => attributes.get(name) ?? null,
            setAttribute: (name, value) => attributes.set(name, value),
        });
        return { button, description, label };
    });
    let cleanup;
    const gsap = {
        matchMedia: () => ({
            add(conditions, callback) {
                cleanup = callback({
                    conditions: { mobile, reducedMotion: false },
                    add: (fn) => fn(),
                });
            },
            revert: () => cleanup?.(),
        }),
        set(target, values) {
            Object.assign(target, values);
        },
        to(target, values) {
            Object.assign(target, values);
            values.onComplete();
            return { kill() {} };
        },
    };
    const init = runInNewContext(`${source}\ninitProjectDescriptions`, {
        createScope,
        gsap,
        ScrollTrigger: { refresh() {} },
    });
    const destroy = init({ querySelectorAll: () => cards.map(({ button }) => button) });
    return { cards, destroy };
}

test('each project expands and collapses independently and retains its state between other clicks', () => {
    const { cards, destroy } = fixture();
    for (const { description } of cards) assert.equal(description.height, 0);
    cards[1].button.dispatchEvent(new Event('click'));
    assert.deepEqual(
        cards.map(({ description }) => description.height),
        [0, 'auto', 0],
    );
    cards[2].button.dispatchEvent(new Event('click'));
    assert.deepEqual(
        cards.map(({ description }) => description.height),
        [0, 'auto', 'auto'],
    );
    cards[1].button.dispatchEvent(new Event('click'));
    assert.deepEqual(
        cards.map(({ description }) => description.height),
        [0, 0, 'auto'],
    );
    assert.equal(cards[1].label.textContent, 'Read');
    assert.equal(cards[2].label.textContent, 'Hide');
    assert.equal(cards[2].description.inert, false);
    destroy();
    for (const { button, description, label } of cards) {
        assert.equal(button.hidden, true);
        assert.equal(button.getAttribute('aria-expanded'), 'true');
        assert.equal(description.inert, false);
        assert.equal(label.textContent, 'Original');
    }
    cards[0].button.dispatchEvent(new Event('click'));
    assert.equal(cards[0].description.height, 0);
});

test('desktop leaves every project description expanded and buttons hidden', () => {
    const { cards, destroy } = fixture(false);
    for (const { button, description } of cards) {
        button.dispatchEvent(new Event('click'));
        assert.equal(button.hidden, true);
        assert.equal(description.height, 'auto');
        assert.equal(description.inert, false);
    }
    destroy();
});
