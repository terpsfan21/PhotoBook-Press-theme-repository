// Next Up Books — order pipeline core (design reservations, mock cart,
// mock checkout, paid-order webhook, fulfillment queue).
//
// Everything here runs against FIXTURES. The functions are shaped after the
// Shopify surfaces they stand in for (Ajax Cart API, orders/paid webhook) so
// the real adapters can replace them without touching the editor.
// Logs never contain names or other personalisation — only opaque IDs.
import crypto from 'node:crypto';
import { CONFIG, BINDINGS, PARTNERS, TITLES, variantById } from '../shared/catalog.js';
import { validateDesign, resolveBook, fingerprintSource, normalizeCharacter } from '../shared/render.js';

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const rid = (bytes = 24) => crypto.randomBytes(bytes).toString('base64url');

export class FlowError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    Object.assign(this, extra);
  }
}

export function createStore(opts = {}) {
  const now = opts.now || (() => Date.now());
  const secret = opts.webhookSecret || rid(32); // per-process dev secret
  const linkKey = rid(32);
  const log = opts.log || (() => {});
  const designs = new Map(); // id → frozen design
  const carts = new Map(); // sessionId → { items, attributes }
  const orders = new Map(); // orderId → order
  const fulfillment = new Map(); // `${orderId}:${lineId}` → record
  const seenEvents = new Set();
  let orderSeq = 1000;
  let lineSeq = 9000;

  const cartOf = (sid) => {
    if (!carts.has(sid)) carts.set(sid, { items: [], attributes: {} });
    return carts.get(sid);
  };

  // ---- designs -----------------------------------------------------------
  function reserveDesign(sid, input) {
    const errors = validateDesign(input);
    if (!input.approved) errors.push({ field: 'approved', message: 'Please confirm you have checked every page before adding to cart.' });
    if (input.variantId == null) errors.push({ field: 'variantId', message: 'Choose softcover or hardcover.' });
    if (errors.length) throw new FlowError(422, 'invalid_design', 'The design could not be saved.', { errors });
    const variant = variantById(input.variantId);
    const book = resolveBook(input);
    const hash = sha(fingerprintSource(book, variant.id));
    if (input.previewHash && input.previewHash !== hash) {
      throw new FlowError(409, 'preview_out_of_date', 'The preview has changed since it was shown. Please review the pages again.');
    }
    const id = rid();
    const strip = (p) => ({ id: p.id, style: p.style, folio: p.folio, title: p.title, body: p.body, alt: p.alt });
    designs.set(id, {
      id, sessionId: sid, shop: CONFIG.shop, status: 'reserved',
      titleId: book.titleId, storyVersion: book.storyVersion, artRevision: book.artRevision, assetsDigest: book.assetsDigest,
      characterRevision: book.characterRevision, variantId: variant.id, sku: variant.sku, binding: variant.binding,
      textSetting: book.textSetting, character: book.character, hash,
      frozenText: { cover: [strip(book.cover.front), strip(book.cover.back)], pages: book.pages.map(strip) },
      approvedAt: now(), createdAt: now(), expiresAt: now() + CONFIG.designTtlMinutes * 60000,
    });
    log('design.reserved', { design: id.slice(0, 8), title: book.titleId, sku: variant.sku });
    return { designId: id, hash, expiresAt: designs.get(id).expiresAt };
  }

  function checkDesign(sid, designId, variantId) {
    const d = designs.get(designId);
    if (!d) return 'This book design could not be found. Please open it again and re-approve the preview.';
    if (sid && d.sessionId !== sid) return 'This book design belongs to a different browser session.';
    if (d.status === 'reserved' && d.expiresAt < now()) return 'This book design has expired. Please re-approve the preview.';
    if (String(d.variantId) !== String(variantId)) return 'The cover type changed after this design was approved. Please choose the binding again.';
    if (d.assetsDigest !== resolveBook({ titleId: d.titleId, character: d.character, textSetting: d.textSetting }).assetsDigest) return 'The artwork was updated after this design was approved. Please review the preview again.';
    return null;
  }

  function deleteDesign(sid, designId) {
    const d = designs.get(designId);
    if (!d || d.sessionId !== sid) throw new FlowError(404, 'not_found', 'Design not found.');
    if (d.status !== 'reserved') throw new FlowError(409, 'ordered', 'This design is part of an order and is kept for production.');
    designs.delete(designId);
    const cart = cartOf(sid);
    cart.items = cart.items.filter((i) => i.properties[CONFIG.designProperty] !== designId);
  }

  function purgeExpired() {
    let count = 0;
    for (const [id, d] of designs) if (d.status === 'reserved' && d.expiresAt < now()) { designs.delete(id); count++; }
    return count;
  }

  // ---- cart (shaped like Shopify's Ajax Cart API) --------------------------
  const lineKey = (variantId, properties) => `${variantId}:${sha(JSON.stringify(Object.entries(properties).sort())).slice(0, 12)}`;

  function cartView(sid) {
    const cart = cartOf(sid);
    const items = cart.items.map((i) => {
      const v = variantById(i.variant_id);
      const d = designs.get(i.properties[CONFIG.designProperty]);
      return {
        key: i.key, id: i.variant_id, variant_id: i.variant_id, quantity: i.quantity, sku: v.sku,
        title: TITLES[v.titleId].title, variant_title: `${BINDINGS[v.binding].label} / ${BINDINGS[v.binding].trim}`,
        price: v.priceCents, line_price: v.priceCents * i.quantity, properties: i.properties,
        // Display-only extras a theme would get from its own lookup:
        nub: { problem: checkDesign(sid, i.properties[CONFIG.designProperty], i.variant_id), name: d?.character.name || '', titleId: v.titleId, binding: v.binding },
      };
    });
    const subtotal = items.reduce((s, i) => s + i.line_price, 0);
    return { items, attributes: cart.attributes, item_count: items.reduce((s, i) => s + i.quantity, 0), items_subtotal_price: subtotal, total_price: subtotal, currency: CONFIG.currency };
  }

  function cartAdd(sid, body) {
    const cart = cartOf(sid);
    for (const item of body.items || [body]) {
      const variant = variantById(item.id);
      if (!variant) throw new FlowError(422, 'bad_variant', 'Cannot find variant');
      const properties = item.properties || {};
      const problem = checkDesign(sid, properties[CONFIG.designProperty], variant.id);
      if (problem) throw new FlowError(422, 'bad_design', problem);
      const key = lineKey(variant.id, properties);
      const existing = cart.items.find((i) => i.key === key);
      const qty = Math.max(1, Math.min(20, Number(item.quantity) || 1));
      // Same SKU with a different design stays a separate line (different key).
      if (existing) existing.quantity = Math.min(20, existing.quantity + qty);
      else cart.items.push({ key, variant_id: variant.id, quantity: qty, properties });
    }
    return cartView(sid);
  }

  function cartChange(sid, body) {
    const cart = cartOf(sid);
    const item = cart.items.find((i) => i.key === body.id);
    if (!item) throw new FlowError(404, 'no_line', 'Cart line not found.');
    const qty = Math.max(0, Math.min(20, Number(body.quantity) || 0));
    if (qty === 0) cart.items = cart.items.filter((i) => i !== item);
    else item.quantity = qty;
    return cartView(sid);
  }

  function cartUpdate(sid, body) {
    const cart = cartOf(sid);
    const attrs = body.attributes || {};
    if (CONFIG.refAttribute in attrs) {
      const code = String(attrs[CONFIG.refAttribute] || '');
      if (PARTNERS[code]) cart.attributes[CONFIG.refAttribute] = code; // unknown codes are ignored
    }
    return cartView(sid);
  }

  // ---- checkout (mock) ----------------------------------------------------
  function checkout(sid, contact = {}) {
    const view = cartView(sid);
    if (!view.items.length) throw new FlowError(422, 'empty_cart', 'Your cart is empty.');
    const bad = view.items.filter((i) => i.nub.problem);
    if (bad.length) throw new FlowError(422, 'cart_needs_attention', 'One or more books need attention before checkout.', { lines: bad.map((i) => ({ key: i.key, problem: i.nub.problem })) });
    const id = ++orderSeq;
    const order = {
      id, name: `#TEST-${id}`, test: true, financial_status: 'paid', currency: CONFIG.currency,
      email: contact.email || 'sample.buyer@example.com',
      shipping_address: contact.shipping_address || null,
      note_attributes: Object.entries(view.attributes).map(([name, value]) => ({ name, value })),
      subtotal_price: view.total_price, shipping_price: CONFIG.sampleShippingCents, total_price: view.total_price + CONFIG.sampleShippingCents,
      line_items: view.items.map((i) => ({ id: ++lineSeq, variant_id: i.variant_id, sku: i.sku, title: i.title, variant_title: i.variant_title, quantity: i.quantity, price: i.price, properties: Object.entries(i.properties).map(([name, value]) => ({ name, value })) })),
      created_at: new Date(now()).toISOString(),
    };
    orders.set(id, order);
    carts.set(sid, { items: [], attributes: {} });
    log('order.created', { order: id, lines: order.line_items.length });
    return order;
  }

  // ---- paid-order webhook ---------------------------------------------------
  function signWebhook(rawBody) {
    return crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  }

  /** Build the simulated orders/paid delivery for an order (body + headers). */
  function buildPaidWebhook(orderOrId, eventId) {
    const order = typeof orderOrId === 'object' ? orderOrId : orders.get(Number(orderOrId));
    if (!order) throw new FlowError(404, 'no_order', 'Order not found.');
    const rawBody = JSON.stringify(order);
    return { rawBody, headers: { 'x-shopify-topic': 'orders/paid', 'x-shopify-shop-domain': CONFIG.shop, 'x-shopify-hmac-sha256': signWebhook(rawBody), 'x-shopify-event-id': eventId || `evt-${order.id}` } };
  }

  function handlePaidWebhook(rawBody, headers) {
    const given = Buffer.from(String(headers['x-shopify-hmac-sha256'] || ''), 'base64');
    const want = crypto.createHmac('sha256', secret).update(rawBody).digest();
    if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) throw new FlowError(401, 'bad_signature', 'Webhook signature check failed.');
    const eventId = headers['x-shopify-event-id'];
    if (eventId && seenEvents.has(eventId)) return { duplicate: true, created: 0 };
    const order = JSON.parse(rawBody);
    let created = 0;
    for (const line of order.line_items || []) {
      if (!String(line.sku || '').startsWith('NUB-')) continue; // other store products are not ours
      const key = `${order.id}:${line.id}`;
      if (fulfillment.has(key)) continue; // one record per order line, ever
      const designId = (line.properties || []).find((p) => p.name === CONFIG.designProperty)?.value || null;
      const d = designId ? designs.get(designId) : null;
      let hold = null;
      if (!designId) hold = 'No design reference on the order line.';
      else if (!d) hold = 'Design reference not found.';
      else if (String(d.variantId) !== String(line.variant_id) || d.sku !== line.sku) hold = 'Order line binding does not match the approved design.';
      else if (d.shop !== (headers['x-shopify-shop-domain'] || d.shop)) hold = 'Design belongs to a different shop.';
      if (d && !hold) d.status = 'ordered'; // ordered designs no longer expire
      fulfillment.set(key, {
        key, orderId: order.id, orderName: order.name, lineId: line.id, sku: line.sku, quantity: line.quantity,
        designId: hold ? null : designId, designHash: hold ? null : d.hash, titleId: hold ? null : d.titleId, binding: hold ? null : d.binding,
        ref: (order.note_attributes || []).find((a) => a.name === CONFIG.refAttribute)?.value || null,
        status: hold ? 'held' : 'awaiting_review', holdReason: hold, createdAt: now(), history: [hold ? 'held' : 'awaiting_review'],
      });
      created++;
      log('fulfillment.created', { key, status: hold ? 'held' : 'awaiting_review' });
    }
    if (eventId) seenEvents.add(eventId);
    return { duplicate: false, created };
  }

  // ---- manual review queue ------------------------------------------------
  function refundOrder(orderId) {
    const out = [];
    for (const r of fulfillment.values()) {
      if (String(r.orderId) !== String(orderId)) continue;
      r.status = r.status === 'released' ? 'refund_after_release' : 'cancelled';
      r.history.push(r.status);
      out.push(r);
    }
    return out;
  }

  function release(key) {
    const r = fulfillment.get(key);
    if (!r) throw new FlowError(404, 'no_record', 'Fulfillment record not found.');
    if (r.status !== 'awaiting_review') throw new FlowError(409, 'not_releasable', `A record that is "${r.status}" cannot be released.`);
    r.status = 'released'; // MOCK: nothing is sent to a production system
    r.history.push('released');
    return r;
  }

  // ---- proof access ---------------------------------------------------------
  function proofToken(designId) {
    const exp = now() + CONFIG.proofLinkMinutes * 60000;
    return `${exp}.${crypto.createHmac('sha256', linkKey).update(`${designId}.${exp}`).digest('base64url')}`;
  }
  function canViewProof(designId, sid, token) {
    const d = designs.get(designId);
    if (!d) return null;
    if (sid && d.sessionId === sid) return d;
    const [exp, mac] = String(token || '').split('.');
    if (!exp || Number(exp) < now()) return null;
    const want = crypto.createHmac('sha256', linkKey).update(`${designId}.${exp}`).digest('base64url');
    return mac === want ? d : null;
  }

  return {
    reserveDesign, deleteDesign, purgeExpired, checkDesign, cartView, cartAdd, cartChange, cartUpdate, checkout,
    buildPaidWebhook, handlePaidWebhook, refundOrder, release, proofToken, canViewProof,
    queue: () => [...fulfillment.values()].sort((a, b) => b.createdAt - a.createdAt),
    getOrder: (id) => orders.get(Number(id)) || null,
    getDesign: (id) => designs.get(id) || null,
    _designs: designs, _orders: orders,
  };
}
