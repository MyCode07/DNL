import { mkdir, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { resolve, relative, dirname, extname, basename } from 'node:path';
import sharp from 'sharp';

async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return []; }
  const files = [];
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

async function writeSharp(input, output, format) {
  await mkdir(dirname(output), { recursive: true });
  const image = sharp(input, { animated: true });

  if (format === 'jpg' || format === 'jpeg') {
    await image.jpeg({ quality: 86, mozjpeg: true }).toFile(output);
  } else if (format === 'png') {
    await image.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(output);
  } else if (format === 'webp') {
    await image.webp({ quality: 84, effort: 4 }).toFile(output);
  } else if (format === 'gif') {
    await image.gif({ effort: 4 }).toFile(output);
  }
}

async function processImages(srcRoot, outDir) {
  const imagesDir = resolve(srcRoot, 'img');
  const files = await walk(imagesDir);

  for (const file of files) {
    const rel = relative(imagesDir, file);
    const ext = extname(file).toLowerCase();
    const output = resolve(outDir, 'img', rel);
    await mkdir(dirname(output), { recursive: true });

    if (ext === '.svg' || ext === '.ico' || ext === '.avif') {
      await cp(file, output, { force: true });
      continue;
    }

    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      try {
        await writeSharp(file, output, ext.slice(1));
        if (ext !== '.webp') {
          const webpOutput = resolve(dirname(output), `${basename(output, ext)}.webp`);
          await writeSharp(file, webpOutput, 'webp');
        }
      } catch (error) {
        console.warn(`[images] fallback copy for ${rel}: ${error.message}`);
        await cp(file, output, { force: true });
      }
      continue;
    }

    await cp(file, output, { force: true });
  }
}

async function copyFiles(srcRoot, outDir) {
  const source = resolve(srcRoot, 'files');
  const destination = resolve(outDir, 'files');
  try {
    await cp(source, destination, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export function staticAssetsPlugin({ projectRoot, srcRoot }) {
  const outDir = resolve(projectRoot, 'dist');
  return {
    name: 'start-static-assets',
    apply: 'build',
    async closeBundle() {
      await Promise.all([
        processImages(srcRoot, outDir),
        copyFiles(srcRoot, outDir)
      ]);
      console.log('[assets] images optimized + WebP generated; files copied');
    }
  };
}
