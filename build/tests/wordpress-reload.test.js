import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { createServer } from 'vite';
import wordpressReload from '../plugins/wordpress-reload.js';

test('WordPress reload watches the theme outside src, including new files', async (t) => {
    const themeRoot = await mkdtemp(resolve(tmpdir(), 'wordpress-reload-'));
    t.after(() => rm(themeRoot, { recursive: true, force: true }));
    for (const dir of ['src', 'inc', 'acf-json', 'dist', 'node_modules']) {
        await mkdir(resolve(themeRoot, dir));
    }
    await writeFile(resolve(themeRoot, 'index.php'), '<?php // initial');
    let ready;
    const server = await createServer({
        configFile: false,
        root: resolve(themeRoot, 'src'),
        logLevel: 'silent',
        plugins: [
            wordpressReload({ themeRoot }),
            {
                name: 'watcher-ready-test',
                configureServer(server) {
                    ready = once(server.watcher, 'ready');
                },
            },
        ],
        server: { host: '127.0.0.1', port: 0 },
        build: { outDir: resolve(themeRoot, 'dist'), emptyOutDir: true },
    });
    t.after(() => server.close());
    await ready;
    await server.listen();
    const messages = [];
    const port = server.httpServer.address().port;
    const socket = new WebSocket(
        `ws://127.0.0.1:${port}/?token=${server.config.webSocketToken}`,
        'vite-hmr',
    );
    t.after(() => socket.close());
    socket.addEventListener('message', (event) => messages.push(JSON.parse(event.data)));
    await once(socket, 'open');
    await new Promise((accept) => setTimeout(accept, 50));
    assert.equal(server.watcher.options.usePolling, false);
    assert.equal(
        messages.filter((message) => message.type === 'full-reload').length,
        0,
        'initial files do not trigger reload',
    );

    async function expectReload(action) {
        messages.length = 0;
        await action();
        await new Promise((accept, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(poll);
                reject(new Error('No full-reload from filesystem event'));
            }, 5000);
            const poll = setInterval(() => {
                if (messages.some((message) => message.type === 'full-reload')) {
                    clearTimeout(timeout);
                    clearInterval(poll);
                    accept();
                }
            }, 20);
        });
        assert.ok(messages.some((message) => message.path === '*'));
    }

    await expectReload(() => writeFile(resolve(themeRoot, 'index.php'), '<?php // changed'));
    await expectReload(() => writeFile(resolve(themeRoot, 'inc/new.php'), '<?php'));
    await expectReload(async () => {
        await mkdir(resolve(themeRoot, 'new/nested'), { recursive: true });
        await writeFile(resolve(themeRoot, 'new/nested/template.php'), '<?php');
    });
    await expectReload(async () => {
        await mkdir(resolve(themeRoot, 'acf-json/nested'));
        await writeFile(resolve(themeRoot, 'acf-json/nested/group.json'), '{}');
    });
    await expectReload(() =>
        writeFile(resolve(themeRoot, 'acf-json/nested/group.json'), '{"key":1}'),
    );
    await expectReload(() => rm(resolve(themeRoot, 'inc/new.php')));

    messages.length = 0;
    await Promise.all(
        [
            'src/style.scss',
            'src/app.js',
            'inc/data.json',
            'dist/skip.php',
            'node_modules/skip.php',
        ].map((name) => writeFile(resolve(themeRoot, name), '/* ignored */')),
    );
    await new Promise((accept) => setTimeout(accept, 400));
    assert.equal(
        messages.length,
        0,
        'assets, unrelated JSON and ignored directories do not reload',
    );
    server.watcher.emit('change', resolve(themeRoot, '../outside.php'));
    await new Promise((accept) => setTimeout(accept, 100));
    assert.equal(messages.length, 0, 'files outside the theme do not reload');
});
