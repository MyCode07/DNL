import { resolve } from 'node:path';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { optimize } from 'svgo';

const srcRoot = resolve(process.cwd(), 'src');
const iconsDir = resolve(srcRoot, 'svg');
const outputDir = resolve(srcRoot, 'img/svg');
const outputFile = resolve(outputDir, 'icons.svg');
await mkdir(iconsDir, { recursive: true });
await mkdir(outputDir, { recursive: true });
const files = (await readdir(iconsDir)).filter((f) => f.endsWith('.svg')).sort();
const symbols = [];
for (const file of files) {
  const raw = await readFile(resolve(iconsDir, file), 'utf8');
  const svg = optimize(raw, { multipass: true, plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false } } }, 'removeDimensions'] }).data;
  const match = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!match) continue;
  const viewBox = match[1].match(/viewBox=["']([^"']+)["']/i)?.[1] || '0 0 24 24';
  const id = file.replace(/\.svg$/i, '').replace(/[^a-zA-Z0-9_-]/g, '-');
  symbols.push(`<symbol id="${id}" viewBox="${viewBox}">${match[2]}</symbol>`);
}
await writeFile(outputFile, `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`);
console.log(`SVG sprite created: ${files.length} icons -> src/img/svg/icons.svg`);
