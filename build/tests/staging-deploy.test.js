import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/staging-deploy.sh', import.meta.url));
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const shellPath = (file) =>
    file.replaceAll('\\', '/').replace(/^([A-Za-z]):/, (_, letter) => `/${letter.toLowerCase()}`);

async function fixture(t) {
    const temporary = await mkdtemp(join(tmpdir(), 'frame-deploy-test-'));
    t.after(() => rm(temporary, { recursive: true, force: true }));
    const bin = join(temporary, 'bin');
    const packageDirectory = join(temporary, 'frame-package');
    await mkdir(bin);
    for (const file of ['functions.php', 'dist/css/style.min.css', 'dist/js/app.min.js']) {
        await mkdir(dirname(join(packageDirectory, file)), { recursive: true });
        await writeFile(join(packageDirectory, file), 'fixture');
    }
    const mocks = {
        'ssh-keygen': '#!/usr/bin/env bash\nexit 0\n',
        ssh: `#!/usr/bin/env bash
set -eu
[[ "$*" == *StrictHostKeyChecking=yes* ]] || exit 80
[[ "$*" == *ServerAliveInterval=15* && "$*" == *ServerAliveCountMax=3* ]] || exit 84
count=0
if [[ -f "$MOCK_DIRECTORY/ssh-count" ]]; then read -r count < "$MOCK_DIRECTORY/ssh-count"; fi
count=$((count + 1))
printf '%s\\n' "$count" > "$MOCK_DIRECTORY/ssh-count"
cat > "$MOCK_DIRECTORY/ssh-input-$count"
[[ "\${MOCK_SSH_FAILURE:-0}" != 1 ]] || exit 81
if [[ "$count" == 2 ]]; then
    [[ "$*" == *'sha256sum --check --strict --quiet'* ]] || exit 82
    [[ "\${MOCK_VERIFY_FAILURE:-0}" != 1 ]] || exit 83
fi
`,
        rsync: `#!/usr/bin/env bash
set -eu
printf '%s\\0' "$@" > "$MOCK_DIRECTORY/rsync-args"
`,
    };
    for (const [name, source] of Object.entries(mocks)) {
        await writeFile(join(bin, name), source, { mode: 0o755 });
    }
    const env = {
        ...process.env,
        RUNNER_TEMP: shellPath(temporary),
        FRAME_PACKAGE_DIR: shellPath(packageDirectory),
        MOCK_DIRECTORY: shellPath(temporary),
        MOCK_BIN: shellPath(bin),
        TEST_SCRIPT: shellPath(script),
        SSH_HOST: 'staging.example',
        STAGING_THEME_PATH: '/var/www/chipsa/data/www/staging.example/wp-content/themes/frame/',
        SSH_PORT: '22',
        SSH_USER: 'chipsa',
        SSH_PRIVATE_KEY: 'fake test key',
        SSH_KNOWN_HOSTS: 'fake test host',
    };
    const run = (extra = {}) =>
        spawnSync(
            bash,
            [
                '--noprofile',
                '--norc',
                '-c',
                'export PATH="$MOCK_BIN:/usr/bin:/bin"; exec bash "$TEST_SCRIPT"',
            ],
            { encoding: 'utf8', env: { ...env, ...extra }, windowsHide: true },
        );
    return { temporary, run };
}

test('staging deploy uses checksums and exact target, never deletes, then verifies package', async (t) => {
    const { temporary, run } = await fixture(t);
    const result = run();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const args = (await readFile(join(temporary, 'rsync-args'), 'utf8'))
        .split('\0')
        .filter(Boolean);
    assert.ok(args.includes('--checksum'));
    assert.ok(args.includes('--delay-updates'));
    assert.ok(args.includes('--timeout=120'));
    assert.ok(!args.includes('--dry-run'));
    assert.ok(!args.some((arg) => arg.startsWith('--delete') || arg.startsWith('--remove-source')));
    assert.equal(
        args.at(-1),
        'chipsa@staging.example:/var/www/chipsa/data/www/staging.example/wp-content/themes/frame/',
    );
    assert.equal((await readFile(join(temporary, 'ssh-count'), 'utf8')).trim(), '2');
    const manifest = await readFile(join(temporary, 'ssh-input-2'), 'utf8');
    assert.match(manifest, /[a-f0-9]{64} [ *]\.\/functions\.php/);
    assert.match(manifest, /[a-f0-9]{64} [ *]\.\/dist\/css\/style\.min\.css/);
});

test('invalid deployment inputs and SSH failure stop before rsync', async (t) => {
    const { temporary, run } = await fixture(t);
    for (const extra of [
        { STAGING_THEME_PATH: '' },
        { STAGING_THEME_PATH: '/' },
        { STAGING_THEME_PATH: '/var/www/chipsa/data/www/../wp-content/themes/frame/' },
        { STAGING_THEME_PATH: '/var/www/chipsa/data/www/staging.example/../themes/frame/' },
        {
            STAGING_THEME_PATH:
                "/var/www/chipsa/data/www/staging.example'; echo unsafe/wp-content/themes/frame/",
        },
        { SSH_USER: 'other' },
        { SSH_HOST: '-unsafe' },
        { SSH_PORT: '0' },
        { FRAME_PACKAGE_DIR: '/outside' },
        { MOCK_SSH_FAILURE: '1' },
    ]) {
        assert.notEqual(run(extra).status, 0);
        await assert.rejects(readFile(join(temporary, 'rsync-args')), { code: 'ENOENT' });
    }
});

test('failed verification after transfer fails the deployment', async (t) => {
    const { run } = await fixture(t);
    const result = run({ MOCK_VERIFY_FAILURE: '1' });
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes('All deployed package files verified'));
});
