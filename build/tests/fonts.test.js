import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { build } from 'vite';
import { createFont, woff2 } from 'fonteditor-core';
import { fontsPlugin } from '../plugins/fonts.js';

async function fixture(t) {
    const root = await mkdtemp(resolve(tmpdir(), 'dnl-fonts-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(resolve(root, 'fonts'));
    await mkdir(resolve(root, 'scss/base'), { recursive: true });
    for (const weight of ['REGULAR', 'MEDIUM']) {
        const name = `TEST-PRAGMATICA-NEXT_${weight}`;
        await copyFile(
            new URL(`../../src/fonts/${name}.OTF`, import.meta.url),
            resolve(root, 'fonts', `${name}.OTF`),
        );
    }
    return root;
}

test('OTF → TTF → WOFF/WOFF2 produces valid assets and all four webfonts enter the bundle', async (t) => {
    const root = await fixture(t);
    const plugin = fontsPlugin({ srcRoot: root });
    await plugin.buildStart();
    const scss = await readFile(resolve(root, 'scss/base/_fonts.scss'), 'utf8');
    assert(scss.includes('font-family: "TEST PRAGMATICA NEXT"'));
    assert(scss.includes('font-weight: 400'));
    assert(scss.includes('font-weight: 500'));
    for (const weight of ['REGULAR', 'MEDIUM']) {
        const name = `TEST-PRAGMATICA-NEXT_${weight}`;
        const ttf = await readFile(resolve(root, 'fonts', `${name}.ttf`));
        assert.equal(ttf.readUInt32BE(0), 0x00010000);
        const original = createFont(await readFile(resolve(root, 'fonts', `${name}.OTF`)), {
            type: 'otf',
        });
        for (const [type, signature] of [
            ['woff', 'wOFF'],
            ['woff2', 'wOF2'],
        ]) {
            const data = await readFile(resolve(root, 'fonts', `${name}.${type}`));
            assert.equal(data.toString('ascii', 0, 4), signature);
            assert(data.length > 48);
            assert.equal(data.readUInt32BE(8), data.length);
            const decoded =
                type === 'woff2'
                    ? createFont(Buffer.from(woff2.decode(data)), { type: 'ttf' })
                    : createFont(data, { type: 'woff' });
            assert.equal(decoded.get().glyf.length, original.get().glyf.length);
        }
    }
    // In-memory bundling: no dev server or project dist directory is created.
    await writeFile(resolve(root, 'fonts.css'), scss.replaceAll('../../fonts/', './fonts/'));
    const result = await build({
        configFile: false,
        root,
        logLevel: 'silent',
        plugins: [plugin],
        build: {
            write: false,
            assetsInlineLimit: 0,
            rolldownOptions: {
                input: resolve(root, 'fonts.css'),
                output: { assetFileNames: 'fonts/[name][extname]' },
            },
        },
    });
    const fonts = result.output.filter((asset) => /\.woff2?$/.test(asset.fileName));
    assert.equal(fonts.length, 4);
    for (const font of fonts) assert(font.source.length > 48, font.fileName);
});

test('empty WOFF2 encoding fails before replacing valid output files', async (t) => {
    const root = await fixture(t);
    const path = resolve(root, 'fonts/TEST-PRAGMATICA-NEXT_MEDIUM.woff2');
    await writeFile(path, 'previous valid output');
    const encode = woff2.encode;
    woff2.encode = () => new Uint8Array();
    try {
        await assert.rejects(fontsPlugin({ srcRoot: root }).buildStart(), /invalid font output/);
        assert.equal(await readFile(path, 'utf8'), 'previous valid output');
    } finally {
        woff2.encode = encode;
    }
});
