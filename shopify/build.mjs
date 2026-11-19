// Builds shopify/dist/nub-storefront.js: one self-contained file holding the
// editor, both stories and all styles (scoped under .nub-app so the host
// theme is not affected). Run from the repo root:  npx --yes esbuild --version && node shopify/build.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
const esbuild = createRequire(import.meta.url)(process.env.ESBUILD || 'esbuild');
const app = fs.readFileSync('public/styles.css', 'utf8').replace(':root {', '& {').replace('\nbody {', '\n& {');
const scoped = `.nub-app {\n${app}\n}\n${fs.readFileSync('public/book.css', 'utf8')}`;
const css = (await esbuild.transform(scoped, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] })).code;
await esbuild.build({
  entryPoints: ['shopify/src/entry.js'], bundle: true, format: 'esm', minify: true, target: ['es2022'],
  outfile: 'shopify/dist/nub-storefront.js', define: { NUB_CSS: JSON.stringify(css) }, legalComments: 'none',
});
console.log('built', fs.statSync('shopify/dist/nub-storefront.js').size, 'bytes; css', css.length);
