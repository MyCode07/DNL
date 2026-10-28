import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('PHP applies the 40-character rule and accepts phone digits with an optional leading plus', (t) => {
    const php = spawnSync('php', ['--version'], { encoding: 'utf8' });
    if (php.error?.code === 'ENOENT' && !process.env.CI) return t.skip('PHP CLI is unavailable');
    assert.equal(php.status, 0, 'PHP CLI is required in CI');
    const script = fileURLToPath(new URL('./fixtures/cf7-validation.php', import.meta.url));
    const source = fileURLToPath(new URL('../../inc/forms/cf7.php', import.meta.url));
    const result = spawnSync('php', [script, source], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /CF7 validation passed/);
});
