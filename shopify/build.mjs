// Builds shopify/dist/nub-storefront.js: one self-contained file holding the
// editor, both stories and all styles (scoped under .nub-app so the host
// theme is not affected). Run from the repo root:  npx --yes esbuild --version && node shopify/build.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
const esbuild = createRequire(import.meta.url)(process.env.ESBUILD || 'esbuild');
// Index of every art file in content/ (name → file, size). The bundle works
// out each file's address from its own location in the theme's assets, so
// new art only needs uploading to the theme plus a rebuilt bundle.
const { loadContent } = await import('../server/content.js');
const index = {};
for (const [name, f] of Object.entries(loadContent('content').assets.files)) {
  if (/^nub-(guide|social|partner)-|^reference-/.test(name) || /email-header|site-share/.test(name)) continue; // marketing files are not used on the page
  index[name] = { file: f.rel.split('/').pop(), w: f.w, h: f.h };
}
fs.writeFileSync('shopify/src/assets.gen.json', JSON.stringify(index, null, 1) + '\n');
const app = fs.readFileSync('public/styles.css', 'utf8').replace(':root {', '& {').replace('\nbody {', '\n& {');
const scoped = `.nub-app {\n${app}\n}\n${fs.readFileSync('public/book.css', 'utf8')}`;
const css = (await esbuild.transform(scoped, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] })).code;
await esbuild.build({
  entryPoints: ['shopify/src/entry.js'], bundle: true, format: 'esm', minify: true, target: ['es2022'],
  outfile: 'shopify/dist/nub-storefront.js', define: { NUB_CSS: JSON.stringify(css) }, legalComments: 'none',
});
console.log('built', fs.statSync('shopify/dist/nub-storefront.js').size, 'bytes; css', css.length);
