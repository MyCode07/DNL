import { defineConfig } from 'vite';
import { resolve, extname } from 'node:path';
import autoprefixer from 'autoprefixer';

import { fontsPlugin } from './build/plugins/fonts.js';
import { svgSpritePlugin } from './build/plugins/svg-sprite.js';
import { staticAssetsPlugin } from './build/plugins/static-assets.js';
import { rawTextPlugin } from './build/plugins/raw-text.js';
import { groupMediaQueriesPlugin } from './build/plugins/group-media-queries.js';
import wordpressReload from './build/plugins/wordpress-reload.js';

const projectRoot = process.cwd();
const srcRoot = resolve(projectRoot, 'src');

function assetFileName(assetInfo) {
    const original = (assetInfo.originalFileNames?.[0] || assetInfo.name || '').replaceAll(
        '\\',
        '/',
    );

    const extension = extname(original).toLowerCase();
    const emittedName = assetInfo.name || '';

    // CSS
    if (emittedName.endsWith('.css')) {
        return 'css/style.min.css';
    }

    // Images
    if (/\.(png|jpe?g|gif|webp|svg|ico|avif)$/i.test(extension)) {
        const marker = '/img/';
        const position = original.lastIndexOf(marker);

        if (position !== -1) {
            return `img/${original.slice(position + marker.length)}`;
        }

        return 'img/[name][extname]';
    }

    // Fonts
    if (/\.(woff2?|ttf|otf|eot)$/i.test(extension)) {
        return 'fonts/[name][extname]';
    }

    // Other assets
    return 'assets/[name][extname]';
}

export default defineConfig(({ command }) => {
    const isBuild = command === 'build';

    return {
        root: srcRoot,

        appType: 'custom',

        base: './',

        publicDir: false,

        plugins: [
            rawTextPlugin(),

            fontsPlugin({
                projectRoot,
                srcRoot,
            }),

            svgSpritePlugin({
                projectRoot,
                srcRoot,
            }),

            staticAssetsPlugin({
                projectRoot,
                srcRoot,
            }),

            wordpressReload({ themeRoot: projectRoot }),
        ],

        resolve: {
            alias: {
                '@img': resolve(srcRoot, 'img'),
                '@js': resolve(srcRoot, 'js'),
                '@scss': resolve(srcRoot, 'scss'),
            },
        },

        server: {
            host: '127.0.0.1',
            port: 4040,
            strictPort: true,
            open: false,

            cors: {
                origin: 'https://dnl.local',
            },

            hmr: {
                host: 'localhost',
                protocol: 'ws',
                clientPort: 4040,
            },
        },

        preview: {
            port: 4040,
        },

        css: {
            devSourcemap: true,

            postcss: {
                plugins: [
                    ...(isBuild ? [groupMediaQueriesPlugin()] : []),

                    autoprefixer({
                        grid: 'autoplace',
                    }),
                ],
            },
        },

        build: {
            outDir: resolve(projectRoot, 'dist'),

            emptyOutDir: true,

            sourcemap: false,

            cssMinify: true,

            // Required for the independent SCSS entry; vendor CSS joins it via Sass.
            cssCodeSplit: true,

            assetsInlineLimit: 0,

            modulePreload: false,

            rolldownOptions: {
                input: {
                    style: resolve(srcRoot, 'scss/style.scss'),

                    app: resolve(srcRoot, 'js/app.js'),
                },

                output: {
                    entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === 'app') {
                            return 'js/app.min.js';
                        }

                        return 'js/[name].min.js';
                    },

                    chunkFileNames: 'js/[name].min.js',

                    assetFileNames: assetFileName,
                },
            },
        },
    };
});
