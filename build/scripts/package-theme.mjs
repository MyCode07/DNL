import { execFileSync } from 'node:child_process';
import { copyFile, lstat, mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const temporaryRoot = resolve(process.env.RUNNER_TEMP || tmpdir());
if (!process.argv[2]) throw new Error('A temporary package directory is required');
const destination = resolve(process.argv[2]);
const temporaryRelative = relative(temporaryRoot, destination);
if (
    !temporaryRelative ||
    temporaryRelative === '..' ||
    temporaryRelative.startsWith(`..${sep}`) ||
    isAbsolute(temporaryRelative)
) {
    throw new Error('The package must be created inside the runner temporary directory');
}

// Refuse reuse: a package must never contain leftovers from an earlier build.
await mkdir(destination);
let count = 0;

async function copyRuntimeFile(file) {
    const source = resolve(root, file);
    const parts = relative(root, source).split(sep);
    for (let index = 1; index <= parts.length; index++) {
        const entry = await lstat(resolve(root, ...parts.slice(0, index)));
        if (entry.isSymbolicLink()) throw new Error(`Runtime symlink is not allowed: ${file}`);
    }
    if (!(await lstat(source)).isFile()) throw new Error(`Not a regular runtime file: ${file}`);
    const output = resolve(destination, file);
    await mkdir(dirname(output), { recursive: true });
    await copyFile(source, output);
    count++;
}

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', windowsHide: true })
    .split('\0')
    .filter(Boolean);
const runtime = tracked.filter(
    (file) =>
        file === 'style.css' ||
        (/^[^/]+\.php$/.test(file) && !file.startsWith('wp-config')) ||
        /^(inc|template-parts|pages)\/.*\.php$/.test(file) ||
        /^acf-json\/.*\.json$/.test(file),
);
// Module paths may change; all tracked PHP under the runtime directories above
// is included without requiring a particular inc/ layout.
for (const required of ['style.css', 'functions.php', 'index.php']) {
    if (!runtime.includes(required)) throw new Error(`Missing tracked runtime file: ${required}`);
}
for (const file of runtime) await copyRuntimeFile(file);
await mkdir(resolve(destination, 'acf-json'), { recursive: true });

async function copyAssetDirectory(directory) {
    const source = resolve(root, directory);
    const entry = await lstat(source);
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
        throw new Error(`Invalid asset directory: ${directory}`);
    }
    await mkdir(resolve(destination, directory), { recursive: true });
    for (const child of await readdir(source, { withFileTypes: true })) {
        const file = `${directory}/${child.name}`;
        if (child.isDirectory()) await copyAssetDirectory(file);
        else await copyRuntimeFile(file);
    }
}

await copyAssetDirectory('assets');

// Only runtime build outputs; no source tree, tooling, tests or local settings.
for (const directory of ['css', 'js', 'img', 'fonts', 'files']) {
    const file = `dist/${directory}`;
    try {
        await lstat(resolve(root, file));
    } catch (error) {
        if (error.code === 'ENOENT' && !['css', 'js'].includes(directory)) continue;
        throw error;
    }
    await copyAssetDirectory(file);
}
for (const file of ['dist/css/style.min.css', 'dist/js/app.min.js', 'dist/img/svg/icons.svg']) {
    if ((await lstat(resolve(destination, file))).size === 0) {
        throw new Error(`Empty runtime asset: ${file}`);
    }
}
console.log(`Frame runtime package: ${count} files`);
