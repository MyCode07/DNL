import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('CF7 logs final results without private payloads and blocks direct file output', (t) => {
    const root = mkdtempSync(join(tmpdir(), 'frame-cf7-log-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'themes'));
    const fixture = fileURLToPath(new URL('./fixtures/cf7-log.php', import.meta.url));
    const run = () => spawnSync('php', [fixture, root], { encoding: 'utf8', windowsHide: true });
    for (let i = 0; i < 2; i++) {
        const result = run();
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(result.stdout + result.stderr, '');
    }
    const path = join(root, 'themes', 'cf7-submissions.php');
    const log = readFileSync(path, 'utf8');
    const [guard, ...lines] = log.trim().split('\n');
    assert.equal(guard, '<?php http_response_code(403); exit; ?>');
    const records = lines.map((line) => JSON.parse(line));
    assert.equal(records.length, 10);
    assert.deepEqual(
        records.slice(0, 5).map((record) => record.status),
        ['mail_sent', 'mail_failed', 'validation_failed', 'spam', 'aborted'],
    );
    assert.equal(records[0].form_id, 9);
    assert.ok(Number.isFinite(Date.parse(records[0].time_utc)));
    assert.deepEqual(records[2].invalid_fields, ['email']);
    assert.doesNotMatch(log, /private@example|private-token|posted_data/);
    const direct = spawnSync('php', [path], { encoding: 'utf8', windowsHide: true });
    assert.equal(direct.status, 0, direct.stderr);
    assert.equal(direct.stdout, '');
});

test('an unwritable CF7 log reports failure without breaking submission output', (t) => {
    const root = mkdtempSync(join(tmpdir(), 'frame-cf7-log-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const fixture = fileURLToPath(new URL('./fixtures/cf7-log.php', import.meta.url));
    const result = spawnSync('php', [fixture, root], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Could not open submission log/);
    assert.doesNotMatch(result.stderr, /PHP Warning|private@example|private-token/);
});
