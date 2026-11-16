import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('author templates and Yoast use localized ACF values with consistent fallbacks', () => {
    const fixture = fileURLToPath(new URL('./fixtures/author.php', import.meta.url));
    const result = spawnSync('php', [fixture], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stderr, '');
    const values = JSON.parse(result.stdout);
    assert.deepEqual(values.ru, {
        name: 'Имя RU',
        jobTitle: 'Должность RU',
        description: 'Описание RU',
    });
    assert.deepEqual(values.en, {
        name: 'Name & EN',
        jobTitle: 'Role EN',
        description: 'Biography EN',
    });
    assert.deepEqual(values.fallback, {
        name: 'Имя RU',
        jobTitle: 'Role EN',
        description: 'Описание RU',
    });
    assert.equal(values.profile, 'Profile name');
});
