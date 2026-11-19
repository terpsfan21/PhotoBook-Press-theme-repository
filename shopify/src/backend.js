// Shopify draft backend for the storefront code in public/app.js.
//
// DRAFT LIMITS (no server behind this yet):
//  - A design is frozen in this browser only, under a random ID. The ID is
//    what goes on the cart line; the design itself is NOT stored anywhere a
//    print job could read it. The hosted design service replaces this file.
//  - If the section has no active products configured, the cart is a
//    stand-in kept in the browser and checkout is off.
import dentist from '../../content/titles/my-first-dentist-visit/title.json';
import haircut from '../../content/titles/my-first-haircut/title.json';
import fixture from '../../content/fixtures/title.json';
import catalog from '../../content/catalog.json';
import assetIndex from './assets.gen.json';
import { CONFIG, BINDINGS } from '../../shared/catalog.js';
import { validateDesign, normalizeCharacter } from '../../shared/render.js';

const cfg = window.NUB_SHOPIFY || {};
// Art lives beside this script in the theme's assets folder. Large files are
// requested at a smaller size for the screen (Shopify resizes on request).
const sized = (file) => {
  if (/-bg(-wheelchair)?\.jpe?g$/.test(file)) return file.replace(/\.(jpe?g)$/, '_1400x.$1');
  if (/^nub-char-/.test(file)) return file.replace(/\.png$/, '_750x.png');
  return file;
};
const files = {};
// DRAFT ONLY: the ~290 character layers are read straight from the public
// GitHub repository at a fixed commit instead of being copied into the theme.
// For launch they belong in the store's own files.
/* global NUB_CHAR_BASE */
for (const [name, f] of Object.entries(assetIndex)) {
  const remote = NUB_CHAR_BASE && /^nub-char-/.test(f.file);
  files[name] = { url: remote ? NUB_CHAR_BASE + f.file : new URL(sized(f.file), import.meta.url).href, w: f.w, h: f.h };
}
Object.assign(files, cfg.assets || {});
const variants = cfg.variants || {};
const real = Object.values(variants).some((v) => v && v.softcover && v.hardcover);
const titles = [dentist, haircut, fixture].map((t) => {
  const v = variants[t.id];
  return v && v.softcover && v.hardcover
    ? { ...t, variants: t.variants.map((x) => ({ ...x, id: v[x.binding] })) }
    : t;
});
const byVariant = (id) => {
  for (const t of titles) for (const v of t.variants || []) if (String(v.id) === String(id)) return { t, v };
  return null;
};
const get = (k, d) => { try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch { return d; } };
const set = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const post = async (url, body) => {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.description || data.message || 'The store could not update the cart.');
  return data;
};
const newId = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function view(lines) {
  const designs = get('nub.designs', {});
  const items = lines.map((l) => {
    const hit = byVariant(l.variant_id);
    const d = designs[l.designId] || {};
    const binding = hit ? BINDINGS[hit.v.binding] : null;
    const price = l.price ?? (binding ? binding.priceCents : 0);
    return {
      key: l.key, variant_id: l.variant_id, quantity: l.quantity,
      title: hit ? hit.t.title : l.title || 'Book',
      variant_title: binding ? `${binding.label} / ${binding.trim}` : l.variant_title || '',
      price, line_price: price * l.quantity,
      properties: { [CONFIG.designProperty]: l.designId },
      nub: { name: d.name || '', problem: null },
    };
  });
  const total = items.reduce((s, i) => s + i.line_price, 0);
  return { items, item_count: items.reduce((s, i) => s + i.quantity, 0), total_price: total };
}

window.NUB_BACKEND = {
  features: { ops: false, testCheckout: false, simulated: !real },
  checkoutUrl: real ? '/checkout' : null,
  async catalog() {
    return {
      titles,
      concepts: catalog.concepts.map((c) => ({ ...c, image: files[c.image.replace(/\.\w+$/, '')]?.url || null })),
      partners: catalog.partners,
      assets: { files, digest: 'shopify-draft' },
      problems: [],
    };
  },
  async cart() {
    if (!real) return view(get('nub.draftcart', []));
    const cart = await (await fetch('/cart.js', { headers: { accept: 'application/json' } })).json();
    const ours = cart.items.filter((i) => i.properties && i.properties[CONFIG.designProperty]);
    return view(ours.map((i) => ({ key: i.key, variant_id: i.variant_id, quantity: i.quantity, price: i.final_price, title: i.product_title, variant_title: i.variant_title, designId: i.properties[CONFIG.designProperty] })));
  },
  async addBook(input, variantId) {
    const errors = validateDesign(input);
    if (errors.length) throw new Error(errors[0].message);
    const id = newId();
    const designs = get('nub.designs', {});
    designs[id] = { name: normalizeCharacter(input.character).name, titleId: input.titleId, hash: input.previewHash };
    set('nub.designs', designs);
    if (real) return post('/cart/add.js', { items: [{ id: Number(variantId), quantity: 1, properties: { [CONFIG.designProperty]: id } }] });
    const lines = get('nub.draftcart', []);
    lines.push({ key: `${variantId}:${id.slice(0, 10)}`, variant_id: variantId, quantity: 1, designId: id });
    set('nub.draftcart', lines);
  },
  async changeQty(key, quantity) {
    if (real) return post('/cart/change.js', { id: key, quantity });
    let lines = get('nub.draftcart', []);
    if (quantity <= 0) lines = lines.filter((l) => l.key !== key);
    else lines.forEach((l) => { if (l.key === key) l.quantity = quantity; });
    set('nub.draftcart', lines);
  },
  async setRef(code) {
    if (real) return post('/cart/update.js', { attributes: { [CONFIG.refAttribute]: code } });
  },
};
