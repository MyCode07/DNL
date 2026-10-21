import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, extname, basename } from 'node:path';
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
    } catch {
        return false;
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
    // Prefer OTF sources to stale intermediate TTF files with the same name.
    const sources = new Map();
    for (const file of files.filter((name) => /\.ttf$/i.test(name))) {
        sources.set(basename(file, extname(file)), file);
    }
    for (const file of files.filter((name) => /\.otf$/i.test(name))) {
        sources.set(basename(file, extname(file)), file);
    }
    if (sources.size) await woff2.init();

    for (const [stem, file] of sources) {
        let input = await readFile(resolve(fontsDir, file));
        const isOtf = extname(file).toLowerCase() === '.otf';
        if (isOtf) {
            // CFF hinting cannot be copied to TrueType bytecode unchanged.
            const font = createFont(input, { type: 'otf', hinting: false, kerning: true });
            input = Buffer.from(font.write({ type: 'ttf', hinting: false, kerning: true }));
        }
        const sfnt = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
        const woffBuffer = Buffer.from(ttf2woff(sfnt));
        const woff2Buffer = Buffer.from(woff2.encode(input));
        // Do not publish empty assets when an encoder rejects its input.
        for (const [type, output, signature] of [
            ['woff', woffBuffer, 'wOFF'],
            ['woff2', woff2Buffer, 'wOF2'],
        ]) {
            if (output.length < 48 || output.toString('ascii', 0, 4) !== signature) {
                throw new Error(`Failed to encode ${file} as ${type}: invalid font output`);
            }
        }
        if (isOtf) await writeFile(resolve(fontsDir, `${stem}.ttf`), input);
        await writeFile(resolve(fontsDir, `${stem}.woff`), woffBuffer);
        await writeFile(resolve(fontsDir, `${stem}.woff2`), woff2Buffer);
    }

    const sourceFiles = [...sources.values()];

    const scssExists = await exists(scssFile);
    const scssContent = scssExists ? await readFile(scssFile, 'utf8') : '';
    const canGenerateScss =
        !scssExists || scssContent.includes('Auto-generated after fonts are added');

    if (canGenerateScss && sourceFiles.length) {
        const rules = sourceFiles
            .sort((a, b) => a.localeCompare(b))
            .map((file) => {
                const { stem, family, weight, style } = fontMeta(file);
                return `@font-face {\n\tfont-family: "${family}";\n\tfont-display: swap;\n\tsrc: url("../../fonts/${stem}.woff2") format("woff2"), url("../../fonts/${stem}.woff") format("woff");\n\tfont-weight: ${weight};\n\tfont-style: ${style};\n}`;
            })
            .join('\n\n');

        await writeFile(scssFile, `${rules}\n`, 'utf8');
        console.log('[fonts] src/scss/base/_fonts.scss created');
    } else if (scssExists && sourceFiles.length) {
        console.log('[fonts] src/scss/base/_fonts.scss already exists. Delete it to regenerate.');
    }
}

export function fontsPlugin({ srcRoot }) {
    let processing;
    const ensureFonts = () => (processing ??= processFonts(srcRoot));
    return {
        name: 'start-fonts',
        async buildStart() {
            await ensureFonts();
        },
        async configureServer() {
            await ensureFonts();
        },
    };
}
