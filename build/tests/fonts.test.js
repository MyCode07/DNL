import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile, readdir, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { build } from 'vite';
import { webfontFixture } from './fixtures/fonts.js';
import { createFont, woff2 } from 'fonteditor-core';
import { fontsPlugin } from '../plugins/fonts.js';

async function fixture(t) {
    const root = await mkdtemp(resolve(tmpdir(), 'dnl-fonts-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(resolve(root, 'fonts'));
    await mkdir(resolve(root, 'scss/base'), { recursive: true });
    for (const weight of ['REGULAR', 'MEDIUM']) {
        const name = `TEST-PRAGMATICA-NEXT_${weight}`;
        // Tests must not depend on the site's replaceable/proprietary font files.
        const font = createFont();
        font.get().name.fontSubFamily = weight;
        await writeFile(
            resolve(root, 'fonts', `${name}.TTF`),
            Buffer.from(font.write({ type: 'ttf' })),
        );
    }
    return root;
}

test('TTF → WOFF/WOFF2 produces valid assets and all four webfonts enter the bundle', async (t) => {
    const root = await fixture(t);
    const plugin = fontsPlugin({ srcRoot: root });
    await plugin.buildStart();
    const scss = await readFile(resolve(root, 'scss/base/_fonts.scss'), 'utf8');
    assert(scss.includes('font-family: "TEST PRAGMATICA NEXT"'));
    assert(scss.includes('font-weight: 400'));
    assert(scss.includes('font-weight: 500'));
    for (const weight of ['REGULAR', 'MEDIUM']) {
        const name = `TEST-PRAGMATICA-NEXT_${weight}`;
        const ttf = await readFile(resolve(root, 'fonts', `${name}.TTF`));
        assert.equal(ttf.readUInt32BE(0), 0x00010000);
        const original = createFont(ttf, { type: 'ttf' });
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
    // The source changed after a previous successful conversion.
    const later = new Date(Date.now() + 1000);
    await utimes(resolve(root, 'fonts/TEST-PRAGMATICA-NEXT_MEDIUM.TTF'), later, later);
    const encode = woff2.encode;
    woff2.encode = () => new Uint8Array();
    try {
        await assert.rejects(fontsPlugin({ srcRoot: root }).buildStart(), /invalid font output/);
        assert.equal(await readFile(path, 'utf8'), 'previous valid output');
    } finally {
        woff2.encode = encode;
    }
});

test('ready WOFF/WOFF2 generate declarations and enter dist byte-for-byte without conversion', async (t) => {
    const { root, data } = await webfontFixture(t);
    const encode = woff2.encode;
    woff2.encode = () => {
        throw new Error('Ready webfonts must not be converted');
    };
    try {
        const plugin = fontsPlugin({ srcRoot: root });
        await plugin.buildStart();
        const scss = await readFile(resolve(root, 'scss/base/_fonts.scss'), 'utf8');
        assert.match(scss, /font-family: "Example"/);
        assert.equal((scss.match(/@font-face/g) || []).length, 1);
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
        for (const type of ['woff', 'woff2']) {
            const asset = result.output.find((item) => item.fileName.endsWith(`.${type}`));
            assert.deepEqual(Buffer.from(asset.source), data[type]);
        }
        assert.deepEqual((await readdir(resolve(root, 'fonts'))).sort(), [
            'Example-Regular.woff',
            'Example-Regular.woff2',
        ]);
    } finally {
        woff2.encode = encode;
    }
});

for (const type of ['woff', 'woff2']) {
    test(`a standalone ${type} font does not create a URL to a missing format`, async (t) => {
        const { root } = await webfontFixture(t, [type]);
        await fontsPlugin({ srcRoot: root }).buildStart();
        const scss = await readFile(resolve(root, 'scss/base/_fonts.scss'), 'utf8');
        assert.match(scss, new RegExp(`format\\("${type}"\\)`));
        assert.equal((scss.match(/url\(/g) || []).length, 1);
    });
}

test('handwritten font declarations are preserved', async (t) => {
    const { root } = await webfontFixture(t);
    const file = resolve(root, 'scss/base/_fonts.scss');
    await mkdir(resolve(root, 'scss/base'), { recursive: true });
    const custom = '// Custom declarations\n@font-face { font-family: Custom; }\n';
    await writeFile(file, custom);
    await fontsPlugin({ srcRoot: root }).buildStart();
    assert.equal(await readFile(file, 'utf8'), custom);
});
