import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createFont, woff2 } from 'fonteditor-core';

export async function webfontFixture(t, extensions = ['woff', 'woff2']) {
    const root = await mkdtemp(resolve(tmpdir(), 'frame-webfonts-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(resolve(root, 'fonts'));
    await woff2.init();
    const font = createFont();
    const data = {};
    for (const type of extensions) {
        data[type] = Buffer.from(font.write({ type }));
        await writeFile(resolve(root, 'fonts', `Example-Regular.${type}`), data[type]);
    }
    return { root, data };
}
