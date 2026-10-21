import path from 'node:path';

export default function wordpressReload({ themeRoot = process.cwd() } = {}) {
    const root = path.resolve(themeRoot);

    return {
        name: 'wordpress-reload',
        apply: 'serve',

        configureServer(server) {
            // Vite's root can be src/. Watch the theme directory itself so new
            // files and directories are discovered, preserving Vite's ignores.
            server.watcher.add(root);

            const reload = (file) => {
                const relative = path.relative(root, file);
                if (
                    relative === '..' ||
                    relative.startsWith(`..${path.sep}`) ||
                    path.isAbsolute(relative)
                ) {
                    return;
                }

                if (
                    !relative.endsWith('.php') &&
                    !(relative.startsWith(`acf-json${path.sep}`) && relative.endsWith('.json'))
                ) {
                    return;
                }

                server.config.logger.info(`[WordPress] Reload: ${relative}`);
                server.ws.send({ type: 'full-reload', path: '*' });
            };

            for (const event of ['add', 'change', 'unlink']) {
                server.watcher.on(event, reload);
            }
        },
    };
}
