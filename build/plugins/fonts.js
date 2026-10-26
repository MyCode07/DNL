import { readdir, readFile, writeFile, mkdir, access, stat } from 'node:fs/promises';
import { resolve, extname, basename, dirname, relative, isAbsolute } from 'node:path';
import { createFont, ttf2woff, woff2 } from 'fonteditor-core';

const WEIGHTS = new Map([
    ['thin', 100],
    ['extralight', 200],
    ['ultralight', 200],
    ['light', 300],
    ['regular', 400],
    ['normal', 400],
    ['medium', 500],
    ['semibold', 600],
    ['demibold', 600],
    ['bold', 700],
    ['extrabold', 800],
    ['ultrabold', 800],
    ['heavy', 800],
    ['black', 900],
]);

async function exists(path) {
    try {
        await access(path);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
    }
}

function fontMeta(fileName) {
    const stem = fileName.replace(/\.[^.]+$/, '');
    const parts = stem.split(/[-_]+/);
    let weight = 400;
    let style = 'normal';
    const familyParts = [];

    for (const part of parts) {
        const token = part.toLowerCase();
        if (WEIGHTS.has(token)) weight = WEIGHTS.get(token);
        else if (token === 'italic' || token === 'oblique') style = token;
        else familyParts.push(part);
    }

    return {
        stem,
        family: familyParts.join(' ') || stem,
        weight,
        style,
    };
}

async function processFonts(srcRoot) {
    const fontsDir = resolve(srcRoot, 'fonts');
    const scssFile = resolve(srcRoot, 'scss/base/_fonts.scss');
    await mkdir(fontsDir, { recursive: true });

    const files = await readdir(fontsDir);
    const webfonts = new Map();
    for (const file of files.filter((name) => /\.woff2?$/i.test(name))) {
        const stem = basename(file, extname(file));
        if (!webfonts.has(stem)) webfonts.set(stem, {});
        webfonts.get(stem)[extname(file).slice(1).toLowerCase()] = file;
    }
    // Prefer OTF sources to stale intermediate TTF files with the same name.
    const sources = new Map();
    for (const file of files.filter((name) => /\.ttf$/i.test(name))) {
        sources.set(basename(file, extname(file)), file);
    }
    for (const file of files.filter((name) => /\.otf$/i.test(name))) {
        sources.set(basename(file, extname(file)), file);
    }
    for (const [stem, file] of sources) {
        const formats = webfonts.get(stem) || {};
        const sourceTime = (await stat(resolve(fontsDir, file))).mtimeMs;
        const missing = [];
        for (const type of ['woff', 'woff2']) {
            if (
                !formats[type] ||
                (await stat(resolve(fontsDir, formats[type]))).mtimeMs < sourceTime
            ) {
                missing.push(type);
            }
        }
        if (!missing.length) continue;
        let input = await readFile(resolve(fontsDir, file));
        const isOtf = extname(file).toLowerCase() === '.otf';
        if (isOtf) {
            // CFF hinting cannot be copied to TrueType bytecode unchanged.
            const font = createFont(input, { type: 'otf', hinting: false, kerning: true });
            input = Buffer.from(font.write({ type: 'ttf', hinting: false, kerning: true }));
        }
        const sfnt = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
        const outputs = [];
        if (missing.includes('woff')) outputs.push(['woff', Buffer.from(ttf2woff(sfnt)), 'wOFF']);
        if (missing.includes('woff2')) {
            await woff2.init();
            outputs.push(['woff2', Buffer.from(woff2.encode(input)), 'wOF2']);
        }
        // Do not publish empty assets when an encoder rejects its input.
        for (const [type, output, signature] of outputs) {
            if (output.length < 48 || output.toString('ascii', 0, 4) !== signature) {
                throw new Error(`Failed to encode ${file} as ${type}: invalid font output`);
            }
        }
        if (isOtf) await writeFile(resolve(fontsDir, `${stem}.ttf`), input);
        for (const [type, output] of outputs) {
            formats[type] = `${stem}.${type}`;
            await writeFile(resolve(fontsDir, formats[type]), output);
        }
        webfonts.set(stem, formats);
    }

    const scssExists = await exists(scssFile);
    const scssContent = scssExists ? await readFile(scssFile, 'utf8') : '';
    const canGenerateScss =
        !scssExists || scssContent.includes('Auto-generated after fonts are added');

    if (canGenerateScss) {
        const rules = [...webfonts.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, formats]) => {
                const { family, weight, style } = fontMeta(formats.woff2 || formats.woff);
                const urls = ['woff2', 'woff']
                    .filter((type) => formats[type])
                    .map((type) => `url("../../fonts/${formats[type]}") format("${type}")`)
                    .join(', ');
                return `@font-face {\n\tfont-family: "${family}";\n\tfont-display: swap;\n\tsrc: ${urls};\n\tfont-weight: ${weight};\n\tfont-style: ${style};\n}`;
            })
            .join('\n\n');
        const content = `/* Auto-generated after fonts are added. Remove this line to edit manually. */\n${rules}\n`;
        if (content !== scssContent) {
            await mkdir(dirname(scssFile), { recursive: true });
            await writeFile(scssFile, content, 'utf8');
            console.log('[fonts] src/scss/base/_fonts.scss updated');
        }
    } else if (webfonts.size) {
        console.log('[fonts] src/scss/base/_fonts.scss already exists. Delete it to regenerate.');
    }
}

export function fontsPlugin({ srcRoot }) {
    let startup;
    let pending = Promise.resolve();
    let cleanup;
    const run = () => {
        pending = pending.catch(() => {}).then(() => processFonts(srcRoot));
        return pending;
    };
    const ensureFonts = () => (startup ??= run());
    return {
        name: 'start-fonts',
        async buildStart() {
            await ensureFonts();
        },
        async configureServer(server) {
            await ensureFonts();
            const fontsDir = resolve(srcRoot, 'fonts');
            const scssFile = resolve(srcRoot, 'scss/base/_fonts.scss');
            let timer;
            server.watcher.add(fontsDir);
            const update = (file) => {
                const path = relative(fontsDir, resolve(file));
                const fontChanged =
                    path &&
                    !path.startsWith('..') &&
                    !isAbsolute(path) &&
                    /\.(otf|ttf|woff2?)$/i.test(path);
                if (!fontChanged && resolve(file) !== scssFile) return;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    run()
                        .then(() => server.ws.send({ type: 'full-reload', path: '*' }))
                        .catch((error) => {
                            server.config.logger.error(`[fonts] ${error.stack || error.message}`);
                            server.ws.send({
                                type: 'error',
                                err: {
                                    message: error.message,
                                    stack: error.stack,
                                    plugin: 'start-fonts',
                                },
                            });
                        });
                }, 100);
            };
            for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, update);
            cleanup = () => {
                clearTimeout(timer);
                for (const event of ['add', 'change', 'unlink']) server.watcher.off(event, update);
            };
        },
        async closeBundle() {
            cleanup?.();
            await pending.catch(() => {});
        },
    };
}
