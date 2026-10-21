import { promises as fs } from 'node:fs';
import { resolve, basename } from 'node:path';
import fg from 'fast-glob';
import { optimize } from 'svgo';

export function svgSpritePlugin({ projectRoot, srcRoot }) {
    const svgSourceDir = resolve(srcRoot, 'svg');
    const spriteOutput = resolve(projectRoot, 'dist/img/svg/icons.svg');

    let devSprite = '';

    async function buildSprite() {
        const files = await fg('*.svg', {
            cwd: svgSourceDir,
            absolute: true
        });

        if (!files.length) {
            devSprite = '';
            return '';
        }

        const symbols = [];

        for (const file of files) {
            const svg = await fs.readFile(file, 'utf8');

            const optimized = optimize(svg, {
                path: file,
                multipass: true,
                plugins: [
                    {
                        name: 'preset-default',
                        params: {
                            overrides: {
                                removeViewBox: false
                            }
                        }
                    }
                ]
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

    async function writeProductionSprite() {
        const sprite = await buildSprite();

        if (!sprite) return;

        await fs.mkdir(resolve(projectRoot, 'dist/img/svg'), {
            recursive: true
        });

        await fs.writeFile(spriteOutput, sprite, 'utf8');
    }

    return {
        name: 'svg-sprite',

        async configResolved(config) {
            if (config.command === 'serve') {
                await buildSprite();
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

            server.watcher.on('add', async (file) => {
                if (!file.startsWith(svgSourceDir)) return;
                if (!file.endsWith('.svg')) return;

                await buildSprite();
            });

            server.watcher.on('change', async (file) => {
                if (!file.startsWith(svgSourceDir)) return;
                if (!file.endsWith('.svg')) return;

                await buildSprite();
            });

            server.watcher.on('unlink', async (file) => {
                if (!file.startsWith(svgSourceDir)) return;
                if (!file.endsWith('.svg')) return;

                await buildSprite();
            });
        },

        async closeBundle() {
            await writeProductionSprite();
        }
    };
}