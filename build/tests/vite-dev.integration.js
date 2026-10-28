import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { createServer } from 'vite';
import configFactory from '../../vite.config.js';
import { svgSpritePlugin } from '../plugins/svg-sprite.js';

test('HTML-free dev allows WordPress origins and writes its same-origin sprite', async (t) => {
    const projectRoot = await mkdtemp(resolve(tmpdir(), 'frame-vite-dev-'));
    t.after(() => rm(projectRoot, { recursive: true, force: true }));
    const srcRoot = resolve(projectRoot, 'src');
    await mkdir(resolve(srcRoot, 'svg'), { recursive: true });
    await mkdir(resolve(srcRoot, 'js'));
    await writeFile(resolve(srcRoot, 'js/app.js'), 'export const ready = true;');
    const icon = resolve(srcRoot, 'svg/test.svg');
    await writeFile(
        icon,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>',
    );
    const config = configFactory({ command: 'serve', mode: 'development' });
    const server = await createServer({
        ...config,
        configFile: false,
        root: srcRoot,
        logLevel: 'silent',
        plugins: [svgSpritePlugin({ projectRoot, srcRoot })],
        optimizeDeps: { ...config.optimizeDeps, entries: [resolve(srcRoot, 'js/app.js')] },
        server: { ...config.server, port: 0, hmr: false },
    });
    t.after(() => server.close());
    await server.listen();
    const url = `http://127.0.0.1:${server.httpServer.address().port}`;
    for (const origin of ['http://dnl.local', 'https://dnl.local']) {
        for (const path of ['/@vite/client', '/js/app.js']) {
            const response = await fetch(url + path, { headers: { Origin: origin } });
            assert.equal(response.status, 200);
            assert.equal(response.headers.get('access-control-allow-origin'), origin);
        }
    }
    const denied = await fetch(url + '/js/app.js', { headers: { Origin: 'https://example.com' } });
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    const output = resolve(projectRoot, 'dist/img/svg/icons.svg');
    assert.match(await readFile(output, 'utf8'), /id="test"/);
    assert.equal(
        await (await fetch(url + '/img/svg/icons.svg')).text(),
        await readFile(output, 'utf8'),
    );

    // Watcher callbacks must finish writing before notifying WordPress clients.
    const messages = [];
    server.ws.send = (message) => messages.push(message);
    await writeFile(
        icon,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>',
    );
    await assertEventually(async () => {
        assert.match(await readFile(output, 'utf8'), /<circle/);
        assert.ok(messages.some((message) => message.type === 'full-reload'));
    });
    await rm(icon);
    await assertEventually(async () => {
        assert.doesNotMatch(await readFile(output, 'utf8'), /id="test"/);
    });
});

async function assertEventually(check) {
    const deadline = Date.now() + 5000;
    for (;;) {
        try {
            await check();
            return;
        } catch (error) {
            if (Date.now() >= deadline) throw error;
            await new Promise((accept) => setTimeout(accept, 25));
        }
    }
}
