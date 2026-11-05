import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { staticAssetsPlugin } from '../plugins/static-assets.js';

async function fixture(t) {
    const root = await mkdtemp(resolve(tmpdir(), 'frame-assets-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const srcRoot = resolve(root, 'src');
    await mkdir(srcRoot);
    return { root, srcRoot, plugin: staticAssetsPlugin({ projectRoot: root, srcRoot }) };
}

test('static assets preserve paths, create WebP and copy supplementary files', async (t) => {
    const { root, srcRoot, plugin } = await fixture(t);
    await mkdir(resolve(srcRoot, 'img/nested'), { recursive: true });
    await mkdir(resolve(srcRoot, 'files'));
    await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } })
        .png()
        .toFile(resolve(srcRoot, 'img/nested/photo.png'));
    await writeFile(
        resolve(srcRoot, 'img/nested/icon.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg"/>',
    );
    await writeFile(resolve(srcRoot, 'files/document.txt'), 'download');
    await plugin.closeBundle();
    for (const format of ['png', 'webp']) {
        const image = await sharp(
            await readFile(resolve(root, `dist/img/nested/photo.${format}`)),
        ).metadata();
        assert.equal(image.format, format);
        assert.equal(image.width, 2);
    }
    assert.equal(await readFile(resolve(root, 'dist/files/document.txt'), 'utf8'), 'download');
    assert.equal(
        await readFile(resolve(root, 'dist/img/nested/icon.svg'), 'utf8'),
        await readFile(resolve(srcRoot, 'img/nested/icon.svg'), 'utf8'),
    );
});

test('missing optional asset directories are allowed but unreadable paths fail the build', async (t) => {
    const { srcRoot, plugin } = await fixture(t);
    await plugin.closeBundle();
    await writeFile(resolve(srcRoot, 'img'), 'not a directory');
    await assert.rejects(plugin.closeBundle(), { code: 'ENOTDIR' });
});
