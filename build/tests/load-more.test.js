import assert from 'node:assert/strict';
import test from 'node:test';
import { initLoadMore } from '../../src/js/features/load-more.js';

const settle = () => new Promise((resolve) => setImmediate(resolve));

function fixture(fetch) {
    const config = {
        url: '/ajax',
        query: '{"post_type":"post"}',
        signature: 'signed',
        page: 1,
        lang: 'ru',
    };
    const button = new EventTarget();
    const container = new EventTarget();
    let appended = 0;
    let refreshed = 0;
    let removed = false;
    let revealed = false;
    const attributes = new Map();
    Object.assign(container, {
        append: () => appended++,
        setAttribute: (name, value) => attributes.set(name, value),
        removeAttribute: (name) => attributes.delete(name),
    });
    let status;
    Object.assign(button, {
        dataset: { loadMore: JSON.stringify(config), textLoading: 'Loading', textError: 'Retry' },
        textContent: 'More',
        disabled: false,
        parentElement: { querySelector: () => container },
        after: (node) => {
            status = node;
        },
        remove: () => {
            removed = true;
        },
    });
    const root = {
        defaultView: { fetch },
        querySelectorAll: () => [button],
        createElement: (tag) =>
            tag === 'template'
                ? {
                      content: {
                          querySelectorAll: () => [
                              {
                                  classList: {
                                      add: () => {
                                          revealed = true;
                                      },
                                  },
                              },
                          ],
                      },
                  }
                : { setAttribute() {}, remove() {} },
    };
    const destroy = initLoadMore(root, { onLoaded: () => refreshed++ });
    return {
        button,
        container,
        destroy,
        attributes,
        status: () => status,
        state: () => ({ appended, refreshed, removed, revealed }),
    };
}

const response = (page, has_more) => ({
    ok: true,
    json: async () => ({ success: true, data: { html: '<article></article>', page, has_more } }),
});

test('load more requests consecutive pages, ignores duplicate clicks and removes the final button', async () => {
    const requests = [];
    let resolve;
    const state = fixture((url, options) => {
        requests.push({ url, options });
        return new Promise((done) => {
            resolve = done;
        });
    });
    state.button.dispatchEvent(new Event('click'));
    state.button.dispatchEvent(new Event('click'));
    assert.equal(requests.length, 1);
    assert.equal(state.button.disabled, true);
    assert.equal(state.button.textContent, 'Loading');
    assert.equal(state.attributes.get('aria-busy'), 'true');
    assert.equal(requests[0].options.body.get('page'), '2');
    assert.equal(requests[0].options.body.get('lang'), 'ru');
    assert.equal(requests[0].options.body.get('signature'), 'signed');
    resolve(response(2, true));
    await settle();
    assert.deepEqual(state.state(), { appended: 1, refreshed: 1, removed: false, revealed: true });
    assert.equal(state.button.textContent, 'More');
    assert.equal(state.attributes.has('aria-busy'), false);
    state.container.dispatchEvent(new Event('load'));
    assert.equal(state.state().refreshed, 2);
    state.button.dispatchEvent(new Event('click'));
    assert.equal(requests[1].options.body.get('page'), '3');
    resolve(response(3, false));
    await settle();
    assert.equal(state.state().removed, true);
    state.destroy();
});

for (const failure of [
    async () => {
        throw new Error('offline');
    },
    async () => ({ ok: false, status: 500 }),
    async () => ({ ok: true, json: async () => ({ success: false }) }),
    async () => response(3, true),
]) {
    test('failed loading keeps the page and allows retry without appending cards', async () => {
        let fail = true;
        const requests = [];
        const state = fixture((url, options) => {
            requests.push(options.body.get('page'));
            return fail ? failure() : Promise.resolve(response(2, false));
        });
        state.button.dispatchEvent(new Event('click'));
        await settle();
        assert.equal(state.status().hidden, false);
        assert.equal(state.status().textContent, 'Retry');
        assert.equal(state.button.disabled, false);
        assert.equal(state.state().appended, 0);
        fail = false;
        state.button.dispatchEvent(new Event('click'));
        await settle();
        assert.deepEqual(requests, ['2', '2']);
        assert.equal(state.state().removed, true);
        state.destroy();
    });
}

test('cleanup aborts pending fetches and ignores late responses', async () => {
    let resolve;
    let signal;
    const state = fixture((url, options) => {
        signal = options.signal;
        return new Promise((done) => {
            resolve = done;
        });
    });
    state.button.dispatchEvent(new Event('click'));
    state.destroy();
    assert.equal(signal.aborted, true);
    resolve(response(2, false));
    await settle();
    assert.equal(state.state().appended, 0);
    state.button.dispatchEvent(new Event('click'));
    assert.equal(state.state().removed, false);
});
