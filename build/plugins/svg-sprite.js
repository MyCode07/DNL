import { promises as fs } from 'node:fs';
import { resolve, basename } from 'node:path';
import fg from 'fast-glob';
import { optimize } from 'svgo';

export function svgSpritePlugin({ projectRoot, srcRoot }) {
    const svgSourceDir = resolve(srcRoot, 'svg');
    const spriteOutput = resolve(projectRoot, 'dist/img/svg/icons.svg');

    let devSprite = '';
    let isBuild = false;

    async function buildSprite() {
        const files = await fg('*.svg', {
            cwd: svgSourceDir,
            absolute: true
        });

        const symbols = [];

        for (const file of files) {
            const svg = await fs.readFile(file, 'utf8');

            const optimized = optimize(svg, {
                path: file,
                multipass: true,
                // SVGO 4 preserves viewBox in preset-default.
                plugins: ['preset-default']
            }).data;

            const id = basename(file, '.svg');

            const viewBoxMatch = optimized.match(/viewBox="([^"]+)"/);
            const viewBox = viewBoxMatch
                ? ` viewBox="${viewBoxMatch[1]}"`
                : '';

            const content = optimized
                .replace(/<\?xml.*?\?>/g, '')
                .replace(/<!DOCTYPE.*?>/g, '')
                .replace(/<svg[^>]*>/, '')
                .replace('</svg>', '')
                .trim();

            symbols.push(
                `<symbol id="${id}"${viewBox}>${content}</symbol>`
            );
        }

        devSprite =
            `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">` +
            symbols.join('') +
            `</svg>`;

        return devSprite;
    }

    async function writeSprite() {
        const sprite = await buildSprite();

        await fs.mkdir(resolve(projectRoot, 'dist/img/svg'), {
            recursive: true
        });

        await fs.writeFile(spriteOutput, sprite, 'utf8');
    }

    return {
        name: 'svg-sprite',

        async configResolved(config) {
            isBuild = config.command === 'build';
            if (config.command === 'serve') {
                // External SVG <use> must stay on the WordPress origin.
                await writeSprite();
            }
        },

        configureServer(server) {
            server.middlewares.use(
                '/img/svg/icons.svg',
                async (req, res) => {
                    if (!devSprite) {
                        await buildSprite();
                    }

                    res.statusCode = 200;
                    res.setHeader(
                        'Content-Type',
                        'image/svg+xml; charset=utf-8'
                    );

                    res.end(devSprite);
                }
            );

            server.watcher.add(resolve(svgSourceDir, '**/*.svg'));

            let pending = Promise.resolve();
            const update = (file) => {
                if (
                    !file.startsWith(svgSourceDir + '/') &&
                    !file.startsWith(svgSourceDir + '\\')
                ) return;
                if (!file.endsWith('.svg')) return;

                pending = pending
                    .then(async () => {
                        await writeSprite();
                        server.ws.send({ type: 'full-reload', path: '*' });
                    })
                    .catch((error) => {
                        server.config.logger.error(`[svg-sprite] ${error.stack || error.message}`);
                        server.ws.send({
                            type: 'error',
                            err: {
                                message: error.message,
                                stack: error.stack,
                                plugin: 'svg-sprite',
                            },
                        });
                    });
            };
            for (const event of ['add', 'change', 'unlink']) {
                server.watcher.on(event, update);
            }
            server.httpServer?.once('close', () => {
                for (const event of ['add', 'change', 'unlink']) {
                    server.watcher.off(event, update);
                }
            });
        },

        async closeBundle() {
            if (isBuild) await writeSprite();
        }
    };
}
