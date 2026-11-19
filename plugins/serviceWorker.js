import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TEMPLATE = resolve('src/sw.js');
const PUBLIC_SHELL = ['offline.html', 'manifest.json', 'favicon.svg', 'hero.svg'];

function isShellAsset(fileName) {
  if (fileName === 'index.html') return true;
  if (/\.(js|css)$/.test(fileName)) return true;
  return /-latin-\d+-normal-[\w-]+\.woff2$/.test(fileName);
}

export function serviceWorker() {
  return {
    name: 'service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const icons = readdirSync(resolve('public/icons')).map((name) => `icons/${name}`);
      const publicFiles = [...PUBLIC_SHELL, ...icons];
      const builtFiles = Object.keys(bundle).filter(isShellAsset).sort();
      const template = readFileSync(TEMPLATE, 'utf8');

      const hash = createHash('sha256').update(template);
      for (const name of builtFiles) {
        const file = bundle[name];
        hash.update(name).update(file.type === 'chunk' ? file.code : file.source);
      }
      for (const name of publicFiles) {
        hash.update(name).update(readFileSync(resolve('public', name)));
      }

      const source = template
        .replace('__BUILD_VERSION__', hash.digest('hex').slice(0, 10))
        .replace('__PRECACHE_URLS__', JSON.stringify([...publicFiles, ...builtFiles], null, 2));

      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
