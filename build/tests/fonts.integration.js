import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { createServer } from 'vite';
import { createFont } from 'fonteditor-core';
import { fontsPlugin } from '../plugins/fonts.js';
import { webfontFixture } from './fixtures/fonts.js';

test('dev serves ready fonts and updates generated SCSS when fonts are added or removed', async (t) => {
    const { root, data } = await webfontFixture(t, ['woff2']);
    await writeFile(resolve(root, 'style.scss'), '@use "scss/base/fonts";');
    const server = await createServer({
        configFile: false,
        root,
        logLevel: 'silent',
        appType: 'custom',
        plugins: [fontsPlugin({ srcRoot: root })],
        optimizeDeps: { noDiscovery: true, include: [] },
        server: { host: '127.0.0.1', port: 0, hmr: false },
    });
    t.after(() => server.close());
    await server.listen();
    const url = `http://127.0.0.1:${server.httpServer.address().port}`;
    const css = await fetch(url + '/style.scss');
    assert.equal(css.status, 200);
    assert.match(await css.text(), /Example-Regular\.woff2/);
    assert.deepEqual(
        Buffer.from(await (await fetch(url + '/fonts/Example-Regular.woff2')).arrayBuffer()),
        data.woff2,
    );
    // Wait for Chokidar's initial scan before changing directory contents.
    await new Promise((done) =>
        server.watcher.getWatched()[resolve(root, 'fonts')]
            ? done()
            : server.watcher.once('ready', done),
    );
    await writeFile(resolve(root, 'fonts/Other-Bold.woff2'), data.woff2);
    await eventually(async () => {
        assert.match(
            await readFile(resolve(root, 'scss/base/_fonts.scss'), 'utf8'),
            /font-family: "Other"/,
        );
    });
    await rm(resolve(root, 'fonts/Example-Regular.woff2'));
    await eventually(async () => {
        assert.doesNotMatch(
            await readFile(resolve(root, 'scss/base/_fonts.scss'), 'utf8'),
            /font-family: "Example"/,
        );
    });
    const rawFile = resolve(root, 'fonts/Raw-Regular.TTF');
    const font = createFont();
    await writeFile(rawFile, Buffer.from(font.write({ type: 'ttf' })));
    const converted = resolve(root, 'fonts/Raw-Regular.woff2');
    await eventually(async () => {
        assert.equal((await readFile(converted)).toString('ascii', 0, 4), 'wOF2');
    });
    const previous = await readFile(converted);
    font.get().name.fontSubFamily = 'Changed';
    await writeFile(rawFile, Buffer.from(font.write({ type: 'ttf' })));
    await eventually(async () => {
        assert.notDeepEqual(await readFile(converted), previous);
    });
    await rm(resolve(root, 'scss/base/_fonts.scss'));
    await eventually(async () => {
        assert.match(
            await readFile(resolve(root, 'scss/base/_fonts.scss'), 'utf8'),
            /font-family: "Other"/,
        );
    });
});

async function eventually(check) {
    const deadline = Date.now() + 8000;
    for (;;) {
        try {
            await check();
            return;
        } catch (error) {
            if (Date.now() >= deadline) throw error;
            await new Promise((done) => setTimeout(done, 25));
        }
    }
}
