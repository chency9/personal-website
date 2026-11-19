import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = path.join(root, 'public');
const mimeTypes = {
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};
const dataUrls = new Map();

async function dataUrl(file) {
  if (!dataUrls.has(file)) {
    const mime = mimeTypes[path.extname(file)];
    if (!mime) throw new Error(`Unsupported offline asset: ${file}`);
    const content = await readFile(file);
    dataUrls.set(file, `data:${mime};base64,${content.toString('base64')}`);
  }
  return dataUrls.get(file);
}

async function inlineCss(css, directory) {
  const urls = [...css.matchAll(/url\(\s*(['"]?)([^'"\s)]+)\1\s*\)/g)];
  for (const [original, , url] of urls) {
    if (/^(data:|#)/i.test(url)) continue;
    if (/^(https?:)?\/\//i.test(url)) throw new Error(`External CSS asset: ${url}`);
    const file = url.startsWith('/') ? path.join(publicDir, url.slice(1)) : path.resolve(directory, url);
    const relative = path.relative(publicDir, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Asset outside public/: ${url}`);
    css = css.replaceAll(original, `url("${await dataUrl(file)}")`);
  }
  return css;
}

// Resolve dynamically selected covers before bundling, including both srcset sizes.
const images = {};
for (const file of await readdir(path.join(publicDir, 'projects'))) {
  if (file.endsWith('.webp')) images[`/projects/${file}`] = await dataUrl(path.join(publicDir, 'projects', file));
}

const result = await build({
  root,
  configFile: false,
  mode: 'offline',
  logLevel: 'warn',
  define: { __OFFLINE_ASSETS__: JSON.stringify(images) },
  build: {
    write: false,
    copyPublicDir: false,
    modulePreload: false,
    cssCodeSplit: false,
    lib: { entry: path.join(root, 'src/main.ts'), name: 'ChencyOffline', formats: ['iife'] },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const output = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
const chunks = output.filter(file => file.type === 'chunk');
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) {
  throw new Error('Offline build must contain one classic script with no external imports.');
}

let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = html.replace(/\s*<script id="file-entry">[\s\S]*?<\/script>/, '');
const vendorScripts = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)];
html = html.replace(/\s*<script src="[^"]+" defer><\/script>/g, '');
html = html.replace(/\s*<script type="module" src="\/src\/main\.ts"><\/script>/, '');
html = html.replace(/\s*<link rel="preload"[^>]*>/g, '');

const fontCss = await inlineCss(
  await readFile(path.join(publicDir, 'fonts/wenkai/wenkai.css'), 'utf8'),
  path.join(publicDir, 'fonts/wenkai'),
);
const styles = [fontCss];
for (const file of output) {
  if (file.type === 'asset' && file.fileName.endsWith('.css')) {
    styles.push(await inlineCss(String(file.source), publicDir));
  }
}
html = html.replace(/<link rel="stylesheet" href="\/fonts\/wenkai\/wenkai.css"\s*\/>/, () => `<style>${styles.join('\n')}</style>`);
html = html.replace('href="/favicon.svg"', `href="${await dataUrl(path.join(publicDir, 'favicon.svg'))}"`);

// Classic scripts at the end of body work over file:// and keep vendor order intact.
const scripts = [];
for (const [, url] of vendorScripts) scripts.push(await readFile(path.join(publicDir, url.slice(1)), 'utf8'));
scripts.push(chunks[0].code);
const tags = scripts.map(script => `<script>${script.replace(/<\/script/gi, '<\\/script')}</script>`).join('\n');
if (/<script[^>]+(?:src=|type="module")|<link[^>]+(?:stylesheet|preload)/i.test(html)) {
  throw new Error('The portable HTML still references an external script or stylesheet.');
}
html = html.replace('</body>', () => `${tags}\n  </body>`);

await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'offline.html'), html);
await writeFile(path.join(root, 'dist/index.html'), html);
console.log(`Portable HTML built: offline.html and dist/index.html (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB each).`);
