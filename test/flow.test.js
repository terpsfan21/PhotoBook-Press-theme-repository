import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../server/content.js';
import { createStore } from '../server/core.js';
import { registerCatalog, TITLES, CONFIG, BINDINGS, variantFor } from '../shared/catalog.js';
import { resolveBook, validateDesign, fingerprintSource, supportContinuity, fillTokens, normalizeCharacter } from '../shared/render.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');
const content = loadContent(root);
registerCatalog(content);
const titles = ['dentist', 'haircut'];
const maya = { name: 'Maya', pronouns: 'she', skin: 's4', hairStyle: 'curls', hairColor: 'black', eyes: 'brown', outfit: 'cardigan', supports: ['glasses'] };
const everything = { name: 'Ren', pronouns: 'they', ageBand: '4-5', skin: 's2', hairStyle: 'wavy', hairColor: 'brown', eyes: 'green', outfit: 'flower', supports: ['aac', 'earDefenders', 'hearingAids', 'glasses'], mobility: 'wheelchair', comfort: 'bunny' };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const design = (titleId, character, binding = 'softcover', extra = {}) => ({ titleId, character, textSetting: 'std', variantId: variantFor(titleId, binding).id, approved: true, ...extra });

test('content loads cleanly and both titles are 24 interior pages within 22–34', () => {
  assert.deepEqual(content.problems, []);
  for (const id of titles) {
    const t = TITLES[id];
    assert.equal(t.pages.length, 24);
    assert.equal(t.interiorPageCount, 24);
    assert.ok(t.pages.length >= CONFIG.pageCountRange[0] && t.pages.length <= CONFIG.pageCountRange[1]);
    assert.deepEqual(t.pages.map((p) => p.id), Array.from({ length: 24 }, (_, i) => `p${String(i + 1).padStart(2, '0')}`));
    for (const b of ['softcover', 'hardcover']) assert.ok(variantFor(id, b), `${id} ${b} variant`);
  }
});

test('every page has standard words, easy words and alt text; name pages have a no-name version', () => {
  for (const id of titles) for (const p of [...TITLES[id].pages, TITLES[id].cover.front]) {
    assert.ok(p.text.std && p.text.easy && p.alt, `${id} ${p.id}`);
    if (/\{name\}/.test(p.text.std)) assert.ok(p.text.noName, `${id} ${p.id} needs noName`);
  }
});

test('the same character carries across both titles and no token is left unfilled', () => {
  for (const c of [maya, everything, { name: '' }, { name: 'Maximiliana-Evangelina J', pronouns: 'he' }]) {
    const books = titles.map((titleId) => resolveBook({ titleId, character: c }));
    assert.deepEqual(books[0].character, books[1].character);
    for (const b of books) for (const p of [b.cover.front, b.cover.back, ...b.pages]) {
      assert.ok(!/[{}]/.test(`${p.title || ''}${p.body}${p.alt}`), `${b.titleId} ${p.id}: ${p.body}`);
      assert.ok(p.body.length > 0);
    }
  }
});

test('pronouns stay independent of appearance and conjugate correctly', () => {
  const c = (pronouns) => normalizeCharacter({ name: 'Ren', pronouns });
  const tpl = '{Name} reads before {their} visit, as {they} {v:likes|like}.';
  assert.equal(fillTokens(tpl, c('she')), 'Ren reads before her visit, as she likes.');
  assert.equal(fillTokens(tpl, c('they')), 'Ren reads before their visit, as they like.');
  const a = resolveBook({ titleId: 'dentist', character: { ...maya, pronouns: 'he' } });
  const b = resolveBook({ titleId: 'dentist', character: { ...maya, pronouns: 'she' } });
  assert.deepEqual(a.pages.map((p) => p.art), b.pages.map((p) => p.art));
  assert.match(a.cover.back.body, /his visit/);
});

test('selected supports are drawn on every page where the child appears', () => {
  for (const titleId of titles) for (const setting of ['std', 'easy']) {
    assert.deepEqual(supportContinuity(resolveBook({ titleId, character: everything, textSetting: setting })), []);
  }
});

test('support-specific words appear (wheelchair, AAC, ear defenders)', () => {
  const d = resolveBook({ titleId: 'dentist', character: everything });
  assert.match(d.pages[10].body, /find a way to sit/);
  assert.match(d.pages[18].body, /use my device/);
  const h = resolveBook({ titleId: 'haircut', character: everything });
  assert.match(h.pages[17].body, /ear defenders/);
});

test('validation: bad names, unavailable art and wrong-title variants are refused', () => {
  assert.equal(validateDesign(design('dentist', maya)).length, 0);
  assert.ok(validateDesign(design('dentist', { ...maya, name: 'x'.repeat(25) })).some((e) => e.field === 'name'));
  assert.ok(validateDesign(design('dentist', { ...maya, name: '<b>Bo</b>' })).some((e) => e.field === 'name'));
  assert.ok(validateDesign(design('dentist', { ...maya, mobility: 'walker' })).some((e) => e.field === 'mobility'));
  assert.ok(validateDesign({ ...design('dentist', maya), variantId: variantFor('haircut', 'softcover').id }).some((e) => e.field === 'variantId'));
  assert.ok(validateDesign({ titleId: 'fixture', character: maya }).length > 0);
});

test('a binding that cannot take the page count is refused, never padded or swapped', () => {
  const keepCounts = BINDINGS.hardcover.spec.allowedPageCounts;
  BINDINGS.hardcover.spec.allowedPageCounts = [28, 32];
  try { assert.ok(validateDesign(design('dentist', maya, 'hardcover')).some((e) => /cannot take a 24-page/.test(e.message))); }
  finally { BINDINGS.hardcover.spec.allowedPageCounts = keepCounts; }
});

test('reserve → cart → checkout → paid webhook → one fulfillment record per line', () => {
  const s = createStore();
  const book = resolveBook({ titleId: 'dentist', character: maya });
  const v = variantFor('dentist', 'softcover');
  const d1 = s.reserveDesign('sidA', design('dentist', maya, 'softcover', { previewHash: sha(fingerprintSource(book, v.id)) }));
  assert.ok(d1.designId.length >= 32, 'opaque high-entropy id');
  const d2 = s.reserveDesign('sidA', design('dentist', everything)); // same SKU, different child
  const prop = (id) => ({ [CONFIG.designProperty]: id });
  s.cartAdd('sidA', { items: [{ id: v.id, quantity: 1, properties: prop(d1.designId) }] });
  let cart = s.cartAdd('sidA', { items: [{ id: v.id, quantity: 2, properties: prop(d2.designId) }] });
  assert.equal(cart.items.length, 2, 'two distinct books of the same SKU stay separate lines');
  cart = s.cartAdd('sidA', { items: [{ id: v.id, quantity: 1, properties: prop(d1.designId) }] });
  assert.equal(cart.items[0].quantity, 2, 'adding the same design again raises the quantity');
  assert.ok(!JSON.stringify(cart.items.map((i) => i.properties)).includes('Maya'), 'no personal data in line item properties');
  assert.ok(Object.keys(cart.items[0].properties).every((k) => k.startsWith('_')), 'properties are private (underscore)');

  const order = s.checkout('sidA', {});
  assert.ok(!JSON.stringify(order).includes('Maya'), 'order payload carries no personalisation');
  const hook = s.buildPaidWebhook(order);
  assert.deepEqual(s.handlePaidWebhook(hook.rawBody, hook.headers), { duplicate: false, created: 2 });
  assert.deepEqual(s.handlePaidWebhook(hook.rawBody, hook.headers), { duplicate: true, created: 0 }, 'same event id ignored');
  const again = s.buildPaidWebhook(order, 'evt-different');
  assert.equal(s.handlePaidWebhook(again.rawBody, again.headers).created, 0, 'new delivery of the same order creates no second record');
  assert.equal(s.queue().length, 2);
  assert.ok(s.queue().every((r) => r.status === 'awaiting_review' && r.designHash));
  assert.equal(s.cartView('sidA').items.length, 0);
});

test('webhook with a bad signature is rejected; tampered or missing designs are held', () => {
  const s = createStore();
  const d = s.reserveDesign('sid', design('haircut', maya, 'hardcover'));
  s.cartAdd('sid', { items: [{ id: variantFor('haircut', 'hardcover').id, quantity: 1, properties: { [CONFIG.designProperty]: d.designId } }] });
  const order = s.checkout('sid', {});
  const hook = s.buildPaidWebhook(order);
  assert.throws(() => s.handlePaidWebhook(hook.rawBody.replace('"quantity":1', '"quantity":9'), hook.headers), /signature/);
  assert.throws(() => s.handlePaidWebhook(hook.rawBody, { ...hook.headers, 'x-shopify-hmac-sha256': 'nope' }), /signature/);
  // fast-purchase path that skipped the cart: wrong binding and missing design
  const sc = variantFor('haircut', 'softcover');
  const bad = { id: 77, name: '#X', note_attributes: [], line_items: [
    { id: 1, variant_id: sc.id, sku: sc.sku, quantity: 1, properties: [{ name: CONFIG.designProperty, value: d.designId }] },
    { id: 2, variant_id: sc.id, sku: sc.sku, quantity: 1, properties: [] },
    { id: 3, variant_id: 1, sku: 'PBP8.5x8.5HCP-GL', quantity: 1, properties: [] },
  ] };
  const h2 = s.buildPaidWebhook(bad, 'evt-bad');
  assert.equal(s.handlePaidWebhook(h2.rawBody, h2.headers).created, 2, 'non-Next Up SKUs are ignored');
  const held = s.queue().filter((r) => r.orderId === 77);
  assert.ok(held.every((r) => r.status === 'held' && r.holdReason));
});

test('cart refuses expired, missing, foreign-session and changed-variant designs', () => {
  let t = 1_000_000;
  const s = createStore({ now: () => t });
  const v = variantFor('dentist', 'softcover');
  const hc = variantFor('dentist', 'hardcover');
  const d = s.reserveDesign('sid', design('dentist', maya));
  const p = { [CONFIG.designProperty]: d.designId };
  assert.throws(() => s.cartAdd('sid', { items: [{ id: hc.id, properties: p }] }), /cover type changed/);
  assert.throws(() => s.cartAdd('other', { items: [{ id: v.id, properties: p }] }), /different browser session/);
  assert.throws(() => s.cartAdd('sid', { items: [{ id: v.id, properties: { [CONFIG.designProperty]: 'nope' } }] }), /could not be found/);
  assert.throws(() => s.cartAdd('sid', { items: [{ id: v.id, properties: {} }] }), /could not be found/);
  s.cartAdd('sid', { items: [{ id: v.id, properties: p }] });
  t += (CONFIG.designTtlMinutes + 1) * 60000;
  assert.match(s.cartView('sid').items[0].nub.problem, /expired/);
  assert.throws(() => s.checkout('sid', {}), /need attention/);
  assert.equal(s.purgeExpired(), 1);
});

test('reservation needs approval and a matching preview fingerprint', () => {
  const s = createStore();
  assert.throws(() => s.reserveDesign('sid', { ...design('dentist', maya), approved: false }), (e) => e.errors.some((x) => x.field === 'approved'));
  assert.throws(() => s.reserveDesign('sid', design('dentist', maya, 'softcover', { previewHash: 'stale' })), /preview has changed/);
});

test('refund cancels unreleased jobs; release works once; proofs need the owner or a valid link', () => {
  let t = 5_000_000;
  const s = createStore({ now: () => t });
  const d = s.reserveDesign('sid', design('dentist', maya));
  s.cartAdd('sid', { items: [{ id: variantFor('dentist', 'softcover').id, quantity: 1, properties: { [CONFIG.designProperty]: d.designId } }] });
  const order = s.checkout('sid', {});
  const hook = s.buildPaidWebhook(order);
  s.handlePaidWebhook(hook.rawBody, hook.headers);
  const rec = s.queue()[0];
  assert.ok(s.canViewProof(d.designId, 'sid', null));
  assert.equal(s.canViewProof(d.designId, 'stranger', null), null);
  const token = s.proofToken(d.designId);
  assert.ok(s.canViewProof(d.designId, null, token));
  t += (CONFIG.proofLinkMinutes + 1) * 60000;
  assert.equal(s.canViewProof(d.designId, null, token), null, 'proof links expire');
  t += CONFIG.designTtlMinutes * 60000;
  assert.equal(s.purgeExpired(), 0, 'ordered designs are kept for production');
  assert.throws(() => s.deleteDesign('sid', d.designId), /kept for production/);
  s.refundOrder(order.id);
  assert.equal(rec.status, 'cancelled');
  assert.throws(() => s.release(rec.key), /cannot be released/);
});
