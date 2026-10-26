import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('PHP AJAX preserves the query and validates pagination and signatures', (t) => {
    const php = spawnSync('php', ['--version'], { encoding: 'utf8' });
    if (php.error?.code === 'ENOENT') return t.skip('PHP CLI is unavailable');
    const fixture = fileURLToPath(new URL('./fixtures/load-more.php', import.meta.url));
    const handler = fileURLToPath(new URL('../../inc/ajax/load-more.php', import.meta.url));
    const result = spawnSync('php', [fixture, handler], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /AJAX contract passed/);
});
