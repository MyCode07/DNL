import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/package-theme.mjs', import.meta.url));

async function fixture(t) {
    const temporary = await mkdtemp(join(tmpdir(), 'frame-package-test-'));
    t.after(() => rm(temporary, { recursive: true, force: true }));
    const root = join(temporary, 'theme');
    await mkdir(root);
    const files = [
        'style.css',
        'functions.php',
        'index.php',
        'inc/helpers.php',
        'inc/enqueue.php',
        'template-parts/card.php',
        'acf-json/group.json',
        'dist/css/style.min.css',
        'dist/js/app.min.js',
        'dist/img/svg/icons.svg',
        'src/private.js',
        'build/test.js',
        '.env',
        'wp-config.php',
    ];
    for (const file of files) {
        await mkdir(join(root, file, '..'), { recursive: true });
        await writeFile(join(root, file), 'fixture content');
    }
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    execFileSync('git', ['add', '--all'], { cwd: root, stdio: 'ignore' });
    await writeFile(join(root, 'inc/untracked-local.php'), 'not a release file');
    const destination = join(temporary, 'package');
    const run = (output = destination) =>
        spawnSync(process.execPath, [script, output], {
            cwd: root,
            encoding: 'utf8',
            env: { ...process.env, RUNNER_TEMP: temporary },
        });
    return { temporary, root, destination, run };
}

async function filesIn(directory, prefix = '') {
    const result = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = `${prefix}${entry.name}`;
        if (entry.isDirectory())
            result.push(...(await filesIn(join(directory, entry.name), `${file}/`)));
        else result.push(file);
    }
    return result.sort();
}

test('runtime package includes theme and assets, excludes secrets and development files', async (t) => {
    const { destination, run } = await fixture(t);
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await filesIn(destination), [
        'acf-json/group.json',
        'dist/css/style.min.css',
        'dist/img/svg/icons.svg',
        'dist/js/app.min.js',
        'functions.php',
        'inc/enqueue.php',
        'inc/helpers.php',
        'index.php',
        'style.css',
        'template-parts/card.php',
    ]);
    assert.notEqual(run().status, 0, 'existing packages cannot be reused');
});

test('runtime package refuses destinations outside the runner temporary directory', async (t) => {
    const { temporary, run } = await fixture(t);
    const result = run(join(temporary, '..', 'outside-package'));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /inside the runner temporary directory/);
});

test('runtime package supports moved inc modules and nested page templates', async (t) => {
    const { root, destination, run } = await fixture(t);
    for (const file of ['inc/helpers.php', 'inc/enqueue.php']) {
        await rm(join(root, file));
    }
    const movedFiles = [
        'inc/#helpers.php',
        'inc/wp/enqueue.php',
        'inc/wp/setup.php',
        'inc/forms/cf7.php',
        'pages/publications.php',
        'pages/legal/cookies.php',
    ];
    for (const file of movedFiles) {
        await mkdir(join(root, file, '..'), { recursive: true });
        await writeFile(join(root, file), '<?php // runtime module');
    }
    execFileSync('git', ['add', '--update'], { cwd: root, stdio: 'ignore' });
    execFileSync('git', ['add', '--', ...movedFiles], { cwd: root, stdio: 'ignore' });
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const packaged = await filesIn(destination);
    for (const file of movedFiles) assert.ok(packaged.includes(file), file);
    assert.ok(!packaged.includes('inc/helpers.php'));
    assert.ok(!packaged.includes('inc/enqueue.php'));
    assert.ok(!packaged.includes('inc/untracked-local.php'));
});

test('runtime package refuses symlinked asset directories', async (t) => {
    const { temporary, root, run } = await fixture(t);
    const external = join(temporary, 'external-fonts');
    await mkdir(external);
    await writeFile(join(external, 'font.woff2'), 'external');
    await symlink(
        external,
        join(root, 'dist/fonts'),
        process.platform === 'win32' ? 'junction' : 'dir',
    );
    const result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid asset directory/);
});
