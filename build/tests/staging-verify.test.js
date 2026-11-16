import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/staging-verify.sh', import.meta.url));
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const shellPath = (file) =>
    file.replaceAll('\\', '/').replace(/^([A-Za-z]):/, (_, letter) => `/${letter.toLowerCase()}`);

async function fixture(t) {
    const temporary = await mkdtemp(join(tmpdir(), 'frame-verify-test-'));
    t.after(() => rm(temporary, { recursive: true, force: true }));
    const bin = join(temporary, 'bin');
    await mkdir(bin);
    for (const asset of ['css/style.min.css', 'js/app.min.js']) {
        const file = join(temporary, 'frame-package/dist', asset);
        await mkdir(join(file, '..'), { recursive: true });
        await writeFile(file, `fixture ${asset}`);
    }
    await writeFile(
        join(bin, 'curl'),
        `#!/usr/bin/env bash
set -eu
output=''
while (( $# > 1 )); do
    if [[ "$1" == '--output' ]]; then output=$2; shift; fi
    shift
done
printf '%s\\n' "$1" >> "$RUNNER_TEMP/requests"
case "$1" in
    */) printf '%s' "\${MOCK_STATUS:-200}"; printf 'homepage' > "$output" ;;
    */css/style.min.css?*)
        [[ "\${MOCK_CURL_FAILURE:-0}" != 1 ]] || exit 22
        printf 'fixture css/style.min.css' > "$output" ;;
    */js/app.min.js?*) printf '%s' "\${MOCK_JS:-fixture js/app.min.js}" > "$output" ;;
    *) exit 80 ;;
esac
`,
        { mode: 0o755 },
    );
    const env = {
        ...process.env,
        RUNNER_TEMP: shellPath(temporary),
        MOCK_BIN: shellPath(bin),
        TEST_SCRIPT: shellPath(script),
        STAGING_URL: 'https://staging.example/',
        GITHUB_SHA: 'a'.repeat(40),
    };
    const run = (extra = {}, validate = false) =>
        spawnSync(
            bash,
            [
                '--noprofile',
                '--norc',
                '-c',
                `export PATH="$MOCK_BIN:/usr/bin:/bin"; exec bash "$TEST_SCRIPT"${validate ? ' --validate' : ''}`,
            ],
            { encoding: 'utf8', env: { ...env, ...extra }, windowsHide: true },
        );
    return { temporary, run };
}

test('HTTPS verification uses the configured origin and checks both deployed assets', async (t) => {
    const { temporary, run } = await fixture(t);
    for (const STAGING_URL of ['https://staging.example', 'https://staging.example/']) {
        const result = run({ STAGING_URL });
        assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const requests = (await readFile(join(temporary, 'requests'), 'utf8')).trim().split('\n');
    assert.deepEqual(requests.slice(0, 3), [
        'https://staging.example/',
        `https://staging.example/wp-content/themes/frame/dist/css/style.min.css?frame_deploy=${'a'.repeat(40)}`,
        `https://staging.example/wp-content/themes/frame/dist/js/app.min.js?frame_deploy=${'a'.repeat(40)}`,
    ]);
});

test('verification accepts protected homepages but rejects HTTP errors and asset mismatches', async (t) => {
    const { run } = await fixture(t);
    assert.equal(run({ MOCK_STATUS: '401' }).status, 0);
    for (const extra of [
        { MOCK_STATUS: '500' },
        { MOCK_STATUS: '403' },
        { MOCK_CURL_FAILURE: '1' },
        { MOCK_JS: 'stale asset' },
    ]) {
        const result = run(extra);
        assert.notEqual(result.status, 0);
        assert.ok(!result.stdout.includes('HTTP availability does not confirm'));
    }
});

test('invalid configuration fails before network requests; validation alone never requests', async (t) => {
    const { temporary, run } = await fixture(t);
    for (const STAGING_URL of [
        '',
        'http://staging.example',
        'https://user:password@staging.example',
        'https://staging.example/path',
        'https://staging.example?query=1',
        'https://staging.example/#fragment',
    ]) {
        assert.notEqual(run({ STAGING_URL }).status, 0);
    }
    assert.notEqual(run({ GITHUB_SHA: 'invalid' }).status, 0);
    assert.equal(run({}, true).status, 0);
    await assert.rejects(readFile(join(temporary, 'requests')), { code: 'ENOENT' });
});
