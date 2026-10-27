import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { initialPhoneCountry } from '../../src/js/features/phone-inputs.js';

test('country selection prefers a saved choice, then an explicit browser region, otherwise stays neutral', () => {
    assert.equal(initialPhoneCountry(['en-US'], 'am'), 'am');
    assert.equal(initialPhoneCountry(['ru', 'en-GB']), 'gb');
    assert.equal(initialPhoneCountry(['zh-Hant-TW']), 'tw');
    assert.equal(initialPhoneCountry(['ru-RU']), 'ru');
    assert.equal(initialPhoneCountry(['en', 'ru']), '');
    assert.equal(initialPhoneCountry(['bad_locale', 'en-US'], 'invalid'), 'us');
    assert.equal(initialPhoneCountry(['es-419']), '');
});

test('PHP applies the 40-character rule and accepts phone digits with an optional leading plus', (t) => {
    const php = spawnSync('php', ['--version'], { encoding: 'utf8' });
    if (php.error?.code === 'ENOENT') return t.skip('PHP CLI is unavailable');
    const script = fileURLToPath(new URL('./fixtures/cf7-validation.php', import.meta.url));
    const source = fileURLToPath(new URL('../../inc/forms/cf7.php', import.meta.url));
    const result = spawnSync('php', [script, source], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /CF7 validation passed/);
});
