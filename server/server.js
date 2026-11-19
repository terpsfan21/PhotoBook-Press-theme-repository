// Next Up Books — local development server (no dependencies).
//   npm start   →  http://localhost:4173
// Serves the storefront prototype, mock Shopify cart/checkout endpoints, the
// simulated paid-order webhook, proofs and the manual review queue.
// DEVELOPMENT ONLY: in-memory data, sample checkout, no real payments.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadContent } from './content.js';
import { createStore, FlowError } from './core.js';
import { registerCatalog, CONFIG, BINDINGS, TITLES } from '../shared/catalog.js';
import { resolveBook, fingerprintSource, pageHTML, esc } from '../shared/render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const PORT = Number(process.env.PORT || 4173);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };

let content = loadContent(CONTENT);
registerCatalog(content);
const refresh = () => { content = loadContent(CONTENT); registerCatalog(content); return content; };
const store = createStore({ log: (event, data) => console.log(`[nub] ${event} ${JSON.stringify(data)}`) });

const send = (res, status, body, headers = {}) => {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'content-type': isObj ? 'application/json' : 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
};
const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', (c) => { size += c.length; if (size > 1e6) reject(new FlowError(413, 'too_large', 'Request too large.')); else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});
const json = async (req) => { const raw = await readBody(req); return raw ? JSON.parse(raw) : {}; };

function session(req, res) {
  const m = /(?:^|;\s*)nub_sid=([A-Za-z0-9_-]{20,})/.exec(req.headers.cookie || '');
  if (m) return m[1];
  const sid = crypto.randomBytes(18).toString('base64url');
  res.setHeader('set-cookie', `nub_sid=${sid}; Path=/; HttpOnly; SameSite=Lax`);
  return sid;
}

function serveFile(res, base, rel) {
  const file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, { error: 'not_found' });
  res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

function proofPage(d) {
  const book = resolveBook({ titleId: d.titleId, character: d.character, textSetting: d.textSetting });
  const hash = crypto.createHash('sha256').update(fingerprintSource(book, d.variantId)).digest('hex');
  const ok = hash === d.hash;
  const pages = [book.cover.front, ...book.pages, book.cover.back];
  const b = BINDINGS[d.binding];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Proof ${esc(d.id.slice(0, 8))}</title>
<link rel="stylesheet" href="/book.css"><style>
body{margin:0;background:#55606b;font-family:system-ui,sans-serif;color:#2e2a26}
.bar{background:#fffaf0;padding:14px 18px;font-size:14px;line-height:1.5}.bar b{color:#8a2f1d}
.sheet{width:min(8.5in,94vw);margin:18px auto;position:relative;box-shadow:0 4px 18px #0006}
.stamp{position:absolute;top:0;right:0;z-index:2;background:#8a2f1d;color:#fff;font:700 11px system-ui;padding:3px 8px;letter-spacing:.08em}
@page{size:8.5in 8.5in;margin:0}
@media print{body{background:none}.bar{display:none}.sheet{width:8.5in;margin:0;box-shadow:none;break-after:page}}
</style></head><body>
<div class="bar"><b>PROOF — not a production file.</b> ${esc(book.title)} · ${esc(b.label)} ${esc(b.trim)} · ${book.pages.length} interior pages · SKU ${esc(d.sku)}<br>
Design ${esc(d.id.slice(0, 8))}… · story ${esc(d.storyVersion)} · art ${esc(d.artRevision)} / ${esc(d.assetsDigest)} · ${ok ? 'Matches the approved preview (fingerprint verified).' : '<b>DOES NOT MATCH the approved preview — hold this job.</b>'}<br>
Trim size only: no bleed, spine, hinge or colour profile is applied because print specifications are not confirmed. Use the browser's Print → Save as PDF for a review copy.</div>
${pages.map((p) => `<div class="sheet"><span class="stamp">PROOF</span>${pageHTML(p, { textSetting: d.textSetting })}</div>`).join('')}
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  try {
    if (req.method === 'GET' && p.startsWith('/shared/')) return serveFile(res, path.join(ROOT, 'shared'), p.slice(8));
    if (req.method === 'GET' && p.startsWith('/content/')) return serveFile(res, CONTENT, decodeURIComponent(p.slice(9)));
    const sid = session(req, res);

    if (req.method === 'GET' && p === '/api/catalog') {
      const c = refresh(); // re-scan so newly dropped files appear on reload
      return send(res, 200, { titles: c.titles, concepts: c.concepts, partners: c.partners, assets: c.assets, problems: c.problems });
    }
    if (req.method === 'POST' && p === '/api/designs') return send(res, 201, store.reserveDesign(sid, await json(req)));
    if (req.method === 'DELETE' && p.startsWith('/api/designs/')) { store.deleteDesign(sid, p.split('/')[3]); return send(res, 200, { deleted: true }); }

    // Mock of Shopify's Ajax Cart API
    if (req.method === 'GET' && p === '/cart.js') return send(res, 200, store.cartView(sid));
    if (req.method === 'POST' && p === '/cart/add.js') return send(res, 200, store.cartAdd(sid, await json(req)));
    if (req.method === 'POST' && p === '/cart/change.js') return send(res, 200, store.cartChange(sid, await json(req)));
    if (req.method === 'POST' && p === '/cart/update.js') return send(res, 200, store.cartUpdate(sid, await json(req)));

    if (req.method === 'POST' && p === '/api/checkout') {
      const order = store.checkout(sid, await json(req));
      const hook = store.buildPaidWebhook(order); // simulated orders/paid delivery
      const result = store.handlePaidWebhook(hook.rawBody, hook.headers);
      return send(res, 201, { order, webhook: result, records: store.queue().filter((r) => r.orderId === order.id) });
    }
    if (req.method === 'POST' && p === '/webhooks/orders/paid') return send(res, 200, store.handlePaidWebhook(await readBody(req), req.headers));

    // Manual review queue. DEV ONLY: a real deployment must put this behind staff sign-in.
    if (req.method === 'GET' && p === '/api/ops/queue') {
      return send(res, 200, { records: store.queue().map((r) => ({ ...r, proofUrl: r.designId ? `/proof/${r.designId}?t=${store.proofToken(r.designId)}` : null })) });
    }
    if (req.method === 'POST' && p === '/api/ops/replay') { const b = await json(req); const hook = store.buildPaidWebhook(b.orderId); return send(res, 200, store.handlePaidWebhook(hook.rawBody, hook.headers)); }
    if (req.method === 'POST' && p === '/api/ops/refund') return send(res, 200, { records: store.refundOrder((await json(req)).orderId) });
    if (req.method === 'POST' && p === '/api/ops/release') return send(res, 200, store.release((await json(req)).key));
    if (req.method === 'POST' && p === '/api/ops/simulate-bad') {
      const t = Object.values(TITLES).find((x) => x.variants?.length);
      const v = t.variants[0];
      const order = { id: Date.now() % 1e6 + 500000, name: '#TEST-BAD', test: true, note_attributes: [], line_items: [{ id: Date.now() % 1e6, variant_id: v.id, sku: v.sku, quantity: 1, properties: [{ name: CONFIG.designProperty, value: 'missing-design-reference' }] }] };
      const hook = store.buildPaidWebhook(order, `evt-bad-${order.id}`);
      return send(res, 200, store.handlePaidWebhook(hook.rawBody, hook.headers));
    }

    if (req.method === 'GET' && p.startsWith('/proof/')) {
      const d = store.canViewProof(p.split('/')[2], sid, url.searchParams.get('t'));
      if (!d) return send(res, 403, '<h1>Proof link expired or not available</h1><p>Open it again from the order page or the review queue.</p>');
      return send(res, 200, proofPage(d));
    }
    if (req.method === 'GET') return serveFile(res, path.join(ROOT, 'public'), p === '/' ? 'index.html' : p.slice(1));
    send(res, 404, { error: 'not_found' });
  } catch (err) {
    if (err instanceof FlowError) return send(res, err.status, { status: err.status, code: err.code, message: err.message, description: err.message, errors: err.errors, lines: err.lines });
    console.error('[nub] error', err.message);
    send(res, err instanceof SyntaxError ? 400 : 500, { status: 500, message: 'Something went wrong.' });
  }
});

server.listen(PORT, () => {
  console.log(`Next Up Books prototype (development) → http://localhost:${PORT}`);
  if (content.problems.length) console.log('Content problems:\n - ' + content.problems.join('\n - '));
});
