import { readFile } from 'node:fs/promises';

const RAW_EXTENSIONS = /\.(svg|glsl|vs|fs|vert|frag)$/i;

export function rawTextPlugin() {
  return {
    name: 'start-raw-text-imports',
    enforce: 'pre',
    async load(id) {
      if (!RAW_EXTENSIONS.test(id) || id.includes('?')) return null;
      const source = await readFile(id, 'utf8');
      return `export default ${JSON.stringify(source)};`;
    }
  };
}
