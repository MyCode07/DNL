import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { initCookies } from '../../src/js/features/cookies.js';

function fixture({
    saved = {},
    fields = [],
    protocol = 'https:',
    raw,
    blocked = false,
    throws = false,
} = {}) {
    const jar = new Map(Object.entries(saved));
    const writes = [];
    const messages = [];
    const options = { blocked, throws };
    const target = () => ({ append: (message) => messages.push(message) });
    const accept = new EventTarget();
    const attributes = new Map();
    const classes = new Set(['_hide']);
    const banner = {
        ...target(),
        querySelector: () => accept,
        setAttribute: (name, value) => attributes.set(name, value),
        classList: {
            toggle: (name, enabled) => (enabled ? classes.add(name) : classes.delete(name)),
        },
        inert: true,
    };
    const inputs = fields.map((field) =>
        Object.assign(
            new EventTarget(),
            {
                checked: false,
                readOnly: false,
                dataset: {},
                matches() {
                    return Boolean(this.disabled || this.fieldsetDisabled);
                },
                closest: () => null,
                parentElement: target(),
            },
            field,
        ),
    );
    const root = {
        documentElement: { lang: 'ru' },
        defaultView: { location: { protocol } },
        querySelector: () => banner,
        querySelectorAll: () =>
            inputs.filter((input) => input.name.toLowerCase().includes('cookie')),
        createElement: () => ({
            setAttribute() {},
            remove() {
                this.removed = true;
            },
        }),
        get cookie() {
            return (
                raw ??
                [...jar]
                    .map(
                        ([name, value]) =>
                            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
                    )
                    .join('; ')
            );
        },
        set cookie(value) {
            if (options.throws) throw new Error('Storage denied');
            if (options.blocked) return;
            writes.push(value);
            const [pair] = value.split(';');
            const separator = pair.indexOf('=');
            jar.set(
                decodeURIComponent(pair.slice(0, separator)),
                decodeURIComponent(pair.slice(separator + 1)),
            );
        },
    };
    const destroy = initCookies(root);
    return {
        root,
        banner,
        accept,
        inputs,
        jar,
        writes,
        messages,
        options,
        destroy,
        classes,
        attributes,
    };
}

for (const protocol of ['https:', 'http:']) {
    test(`acceptance persists for 30 days and hides the banner on ${protocol}`, () => {
        const state = fixture({ protocol, saved: { cookie_extra: '1' } });
        assert.equal(state.classes.has('_hide'), false);
        assert.equal(state.banner.inert, false);
        state.accept.dispatchEvent(new Event('click'));
        assert.equal(state.jar.get('cookie'), '1');
        assert.equal(state.classes.has('_hide'), true);
        assert.equal(state.banner.inert, true);
        assert.equal(state.attributes.get('aria-hidden'), 'true');
        assert.match(state.writes[0], /Max-Age=2592000; Path=\/; SameSite=Lax/);
        assert.equal(state.writes[0].includes('; Secure'), protocol === 'https:');
        state.destroy();
        const restored = fixture({ saved: Object.fromEntries(state.jar) });
        assert.equal(restored.classes.has('_hide'), true);
        restored.destroy();
    });
}

test('restores and saves both preference states, leaving locked and unrelated fields alone', () => {
    const state = fixture({
        saved: { cookie_stats: '0', cookie_required: '0', cookie_readonly: '0' },
        fields: [
            { name: 'cookie_stats', checked: true },
            { name: 'cookie_required', checked: true, disabled: true },
            { name: 'cookie_readonly', checked: true, readOnly: true },
            { name: 'cookie_fieldset', checked: true, fieldsetDisabled: true },
            { name: 'newsletter' },
            { name: 'COOKIE_OTHER' },
            { name: 'cookie_stats' },
        ],
    });
    const [stats, required, readonly, fieldset, unrelated, other, peer] = state.inputs;
    assert.equal(stats.checked, false);
    assert.equal(required.checked, true);
    assert.equal(readonly.checked, true);
    assert.equal(fieldset.checked, true);
    for (const field of [required, readonly, fieldset, unrelated])
        field.dispatchEvent(new Event('change'));
    assert.equal(state.writes.length, 0);
    stats.checked = true;
    stats.dispatchEvent(new Event('change'));
    assert.equal(peer.checked, true);
    assert.equal(state.jar.get('cookie_stats'), '1');
    stats.checked = false;
    stats.dispatchEvent(new Event('change'));
    assert.equal(peer.checked, false);
    assert.equal(state.jar.get('cookie_stats'), '0');
    other.checked = true;
    other.dispatchEvent(new Event('change'));
    assert.equal(state.jar.get('COOKIE_OTHER'), '1');
    assert.equal(state.classes.has('_hide'), false, 'Preferences do not imply banner acceptance');
    state.destroy();
});

for (const throws of [false, true]) {
    test('failed writes retain the banner, restore the checkbox and allow a retry', () => {
        const state = fixture({ blocked: true, throws, fields: [{ name: 'cookie_stats' }] });
        state.accept.dispatchEvent(new Event('click'));
        assert.equal(state.classes.has('_hide'), false);
        assert.equal(state.messages[0].hidden, false);
        state.inputs[0].checked = true;
        state.inputs[0].dispatchEvent(new Event('change'));
        assert.equal(state.inputs[0].checked, false);
        assert.equal(state.messages[1].hidden, false);
        state.options.blocked = false;
        state.options.throws = false;
        state.accept.dispatchEvent(new Event('click'));
        assert.equal(state.classes.has('_hide'), true);
        assert.equal(state.messages[0].hidden, true);
        state.destroy();
        assert.ok(state.messages.every((message) => message.removed));
    });
}

test('cached HTML without a saved preference restores the shortcode default', () => {
    const state = fixture({
        fields: [{ name: 'cookie_stats', checked: false, dataset: { cookieDefaultChecked: '1' } }],
    });
    assert.equal(state.inputs[0].checked, true);
    assert.equal(state.writes.length, 0, 'A default is not a saved user choice');
    state.destroy();
});

test('malformed cookie values do not break initialization and cleanup removes listeners', () => {
    const state = fixture({
        raw: 'cookie_stats=%E0%A4%; cookie=0',
        fields: [{ name: 'cookie_stats', checked: true }],
    });
    assert.equal(state.inputs[0].checked, true);
    assert.equal(state.classes.has('_hide'), false);
    state.destroy();
    state.accept.dispatchEvent(new Event('click'));
    state.inputs[0].dispatchEvent(new Event('change'));
    assert.equal(state.writes.length, 0);
});

test('PHP helpers and shortcode restore saved preferences and update the current request', (t) => {
    const php = spawnSync('php', ['--version'], { encoding: 'utf8' });
    if (php.error?.code === 'ENOENT') return t.skip('PHP CLI is unavailable');
    const script = fileURLToPath(new URL('./fixtures/cookies.php', import.meta.url));
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const result = spawnSync('php', [script, root], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Cookie PHP checks passed/);
});
