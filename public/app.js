// Next Up Books — storefront prototype (vanilla JS, no build step).
// Journey: choose a story → make the character → preview every page →
// choose softcover or hardcover → cart → test checkout → order + proof.
import { registerCatalog, TITLES, CONCEPTS, PARTNERS, ASSETS, OPTIONS, BINDINGS, CONFIG, DEFAULT_CHARACTER, NAME_MAX, variantFor, money } from '../shared/catalog.js';
import { resolveBook, renderArt, pageHTML, fingerprintSource, normalizeCharacter, validateName, validateDesign, resolveText, fillTokens, esc } from '../shared/render.js';
import { renderCharacter, SKIN, HAIR_COLOR, EYES, OUTFITS } from '../shared/character.js';

const main = document.getElementById('main');
const live = document.getElementById('live');
const $ = (sel, root = document) => root.querySelector(sel);
const say = (msg) => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30); };

// ---- state (this browser tab only; nothing is stored on a server until "Add to cart")
const load = (k, d) => { try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const state = {
  character: { ...DEFAULT_CHARACTER, ...load('nub.character', {}) },
  textSetting: load('nub.text', 'std'),
  binding: load('nub.binding', 'softcover'),
  view: 'book', index: 0, step: 'character', problems: [],
};
const keep = () => { save('nub.character', state.character); save('nub.text', state.textSetting); save('nub.binding', state.binding); };

async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { 'content-type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Something went wrong. Please try again.'), data);
  return data;
}
// Where designs, the cart and checkout live. The local dev server is the
// default; the Shopify draft supplies its own (see shopify/src/backend.js).
const backend = window.NUB_BACKEND || {
  features: { ops: true, testCheckout: true, simulated: false },
  catalog: () => api('/api/catalog'),
  cart: () => api('/cart.js'),
  async addBook(input, variantId) {
    const d = await api('/api/designs', { method: 'POST', body: input });
    // Only the opaque design ID travels with the cart line (private property).
    await api('/cart/add.js', { method: 'POST', body: { items: [{ id: variantId, quantity: 1, properties: { [CONFIG.designProperty]: d.designId } }] } });
  },
  changeQty: (key, quantity) => api('/cart/change.js', { method: 'POST', body: { id: key, quantity } }),
  setRef: (code) => api('/cart/update.js', { method: 'POST', body: { attributes: { [CONFIG.refAttribute]: code } } }),
};
async function refreshCart() {
  const cart = await backend.cart();
  $('#cart-link').textContent = `Cart (${cart.item_count})`;
  return cart;
}
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const orderable = () => Object.values(TITLES).filter((t) => t.status !== 'fixture');
const cardUrl = (t) => ASSETS.files[(t.cardImage || '').replace(/\.\w+$/, '')]?.url || '';

// ---- collection page ---------------------------------------------------------
function viewHome() {
  const ref = PARTNERS[load('nub.ref', '')];
  const F = ASSETS.files;
  const heroD = F['nub-site-hero-desktop'];
  const heroM = F['nub-site-hero-mobile'];
  const step = (n) => (F[`nub-site-step-${n}`] ? `<img src="${esc(F[`nub-site-step-${n}`].url)}" alt="" width="96" height="96">` : '');
  main.innerHTML = `
  <section class="hero ${heroD ? 'art' : ''}">
    ${heroD ? `<picture><source media="(max-width: 700px)" srcset="${esc((heroM || heroD).url)}"><img src="${esc(heroD.url)}" alt="A child and a grown-up reading a picture book together on a sofa" width="2400" height="1100"></picture>` : ''}
    <div class="hero-text">
      <h1>A little story for a big first.</h1>
      <p class="lead">Put your child in an illustrated story about what they might see, hear, and do the first time.</p>
      ${ref ? `<p class="tag ok">Shared with you by ${esc(ref.name)}</p>` : ''}
      <p><a class="btn" href="#/make/${orderable()[0].id}">Make a book</a></p>
    </div>
  </section>
  <ol class="steps ${F['nub-site-step-1'] ? 'pics' : ''}">
    <li>${step(1)}<div><h3>Choose a story</h3><span class="muted">Dentist or haircut to start.</span></div></li>
    <li>${step(2)}<div><h3>Make the character</h3><span class="muted">Name, look, and the things that help.</span></div></li>
    <li>${step(3)}<div><h3>Read every page first</h3><span class="muted">Then order an 8.5 × 8.5 in softcover or hardcover.</span></div></li>
  </ol>
  <h2>First Experiences</h2>
  <ul class="cards">
    ${orderable().map((t) => `<li class="card"><img src="${esc(cardUrl(t))}" alt="Concept illustration for ${esc(t.title)}"><div class="body"><h3>${esc(t.title)}</h3><p class="muted">${esc(t.blurb)}</p><p class="muted">${t.pages.length} story pages · softcover ${money(BINDINGS.softcover.priceCents)} · hardcover ${money(BINDINGS.hardcover.priceCents)}</p><a class="btn" href="#/make/${t.id}">Personalize <span class="sr">${esc(t.title)}</span></a></div></li>`).join('')}
    ${CONCEPTS.map((c) => `<li class="card soon"><img src="${esc(c.image || '')}" alt="Concept illustration for ${esc(c.title)}"><div class="body"><h3>${esc(c.title)}</h3><p><span class="tag">${esc(c.note)}</span></p></div></li>`).join('')}
  </ul>
  <p class="note" style="margin-top:22px">Draft: pages without finished illustrations yet show labeled placeholder drawings.</p>`;
}

// ---- editor --------------------------------------------------------------------
const swatch = { skin: SKIN, hairColor: HAIR_COLOR, eyes: EYES, outfit: Object.fromEntries(Object.entries(OUTFITS).map(([k, v]) => [k, v.top])) };

// Small pictures for option buttons, when the art has been delivered.
const optIcon = (key, id) => {
  const name = { hairStyle: `nub-site-opt-hair-${id}`, outfit: `nub-site-opt-outfit-${id}` }[key] || `nub-site-opt-${id}`;
  const f = ['hairStyle', 'outfit', 'comfort', 'mobility', 'supports'].includes(key) ? ASSETS.files[name] : null;
  return f ? `<img class="ico" src="${esc(f.url)}" alt="" width="40" height="40">` : '';
};

function radios(key, legend, hint = '') {
  const cur = state.character[key];
  return `<fieldset><legend>${legend}</legend>${hint ? `<p class="hint">${hint}</p>` : ''}<div class="choices">${OPTIONS[key].map((o) => `<label class="choice ${swatch[key] ? 'swatch' : ''}"><input type="radio" name="${key}" value="${o.id}" ${cur === o.id ? 'checked' : ''}><span>${optIcon(key, o.id) || (swatch[key] ? `<i class="sw" style="background:${swatch[key][o.id]}"></i>` : '')}${esc(o.label)}</span></label>`).join('')}</div></fieldset>`;
}

function characterForm(t) {
  const c = state.character;
  const av = t.availability;
  return `
  <form id="char" novalidate>
    <fieldset><legend>About the child</legend>
      <label class="field" for="name">First name or nickname <span class="muted">(optional)</span></label>
      <p class="hint" id="name-hint">Shown on the cover and in the story. Up to ${NAME_MAX} characters. Leave blank for a book without a name.</p>
      <input type="text" id="name" name="name" value="${esc(c.name)}" maxlength="${NAME_MAX + 6}" autocomplete="off" aria-describedby="name-hint name-error">
      <p class="error" id="name-error" role="alert"></p>
      <label class="field" for="pronouns" style="margin-top:10px">Pronouns <span class="muted">(used in the note to grown-ups)</span></label>
      <select id="pronouns" name="pronouns">${OPTIONS.pronouns.map((o) => `<option value="${o.id}" ${c.pronouns === o.id ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>
    </fieldset>
    ${radios('ageBand', 'Age <span class="muted">(optional)</span>', 'Changes the character’s size a little. No birthday needed.')}
    ${radios('skin', 'Skin tone')}
    ${radios('hairStyle', 'Hair style')}
    ${radios('hairColor', 'Hair color')}
    ${radios('eyes', 'Eye color')}
    ${radios('outfit', 'Outfit')}
    <fieldset><legend>Things that help <span class="muted">(optional)</span></legend>
      <p class="hint">Choose any that your child uses. They appear on every page.</p>
      <div class="choices">${OPTIONS.supports.map((o) => `<label class="choice"><input type="checkbox" name="supports" value="${o.id}" ${c.supports.includes(o.id) ? 'checked' : ''} ${av.supports[o.id] ? '' : 'disabled'}><span>${optIcon('supports', o.id)}${esc(o.label)}</span></label>`).join('')}</div>
    </fieldset>
    <fieldset><legend>Mobility aid</legend>
      <div class="choices">${OPTIONS.mobility.map((o) => `<label class="choice"><input type="radio" name="mobility" value="${o.id}" ${c.mobility === o.id ? 'checked' : ''} ${av.mobility[o.id] ? '' : 'disabled'}><span>${optIcon('mobility', o.id)}${esc(o.label)}${av.mobility[o.id] ? '' : ' — art not ready yet'}</span></label>`).join('')}</div>
    </fieldset>
    ${radios('comfort', 'Comfort item')}
  </form>`;
}

function stageSVG() {
  const c = normalizeCharacter(state.character);
  const seated = c.mobility === 'wheelchair';
  return `<svg viewBox="-170 ${seated ? -330 : -350} 340 ${seated ? 350 : 370}" role="img" aria-label="Preview of the character with the current choices">${renderCharacter(c, { pose: 'wave' })}</svg>`;
}

function bookItems(book) {
  return [book.cover.front, ...book.pages, book.cover.back];
}
function bookViews(book, spread) {
  const n = book.pages.length;
  if (!spread) return bookItems(book).map((_, i) => [i]);
  const v = [[0], [1]];
  for (let i = 2; i < n; i += 2) v.push([i, i + 1]);
  v.push([n], [n + 1]);
  return v;
}
const itemLabel = (i, n) => (i === 0 ? 'Front cover' : i === n + 1 ? 'Back cover' : `Page ${i} of ${n}`);

function previewPanel(book) {
  const items = bookItems(book);
  const n = book.pages.length;
  const o = { textSetting: state.textSetting };
  let body = '';
  if (state.view === 'grid') {
    body = `<ul class="grid">${items.map((p, i) => `<li aria-label="${itemLabel(i, n)}">${pageHTML(p, o)}</li>`).join('')}</ul>`;
  } else if (state.view === 'text') {
    body = `<ol class="textview">${book.pages.map((p) => `<li><div class="t">${p.title ? `${esc(p.title)}. ` : ''}${esc(p.body)}</div><div class="a">Picture: ${esc(p.alt)}</div></li>`).join('')}</ol>`;
  } else {
    const spread = window.matchMedia('(min-width: 860px)').matches;
    const views = bookViews(book, spread);
    state.index = Math.max(0, Math.min(views.length - 1, state.index));
    const cur = views[state.index];
    if (state.index === views.length - 1) state.seenAll = true;
    const label = cur.length === 2 ? `Pages ${cur[0]}–${cur[1]} of ${n}` : itemLabel(cur[0], n);
    body = `<div class="book ${cur.length === 2 ? 'spread' : ''}" id="book">${cur.map((i) => pageHTML(items[i], o)).join('')}</div>
    <div class="pager"><button class="btn ghost" id="prev" ${state.index === 0 ? 'disabled' : ''}>← Back</button><output id="where">${label}</output><button class="btn" id="next" ${state.index === views.length - 1 ? 'disabled' : ''}>Next →</button></div>
    <p class="muted" style="text-align:center">Tip: use the left and right arrow keys.</p>`;
  }
  if (state.view === 'grid') state.seenAll = true;
  return `
  <div class="toolbar">
    <fieldset><legend>Show</legend><div class="choices">${[['book', 'One at a time'], ['grid', 'All pages'], ['text', 'Text only']].map(([id, l]) => `<label class="choice"><input type="radio" name="view" value="${id}" ${state.view === id ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>
    <fieldset><legend>Words</legend><div class="choices">${[['std', 'Standard'], ['easy', 'Easy to read']].map(([id, l]) => `<label class="choice"><input type="radio" name="textSetting" value="${id}" ${state.textSetting === id ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>
  </div>${body}`;
}

function orderPanel(t, book) {
  const c = book.character;
  const errs = validateDesign({ titleId: t.id, character: c, textSetting: state.textSetting, variantId: variantFor(t.id, state.binding)?.id });
  const front = pageHTML(book.cover.front, { textSetting: state.textSetting, placeholderLabel: false });
  return `
  <fieldset><legend>Choose the cover</legend>
    <div class="bindings">${Object.values(BINDINGS).map((b) => `<label class="binding"><input type="radio" name="binding" value="${b.id}" ${state.binding === b.id ? 'checked' : ''}><div class="box"><div class="mock ${b.id === 'hardcover' ? 'hard' : 'soft'}" aria-hidden="true"><div class="face">${front}</div></div><h3>${b.label}</h3><div class="price">${money(b.priceCents)}</div><p class="muted">${b.trim} · ${t.pages.length} story pages<br>${esc(b.blurb)}</p><span class="tag">${esc(b.priceNote)}</span></div></label>`).join('')}</div>
  </fieldset>
  <div class="summary">
    <h3>Your book</h3>
    <p>${esc(t.title)}${c.name ? ` for <strong>${esc(c.name)}</strong>` : ' (no name)'} · ${BINDINGS[state.binding].label}, ${BINDINGS[state.binding].trim} · ${state.textSetting === 'easy' ? 'easy-to-read words' : 'standard words'}</p>
    <p class="muted">Shipping: ${money(CONFIG.sampleShippingCents)} sample flat rate. Printing and delivery time: to be confirmed with Linemark before launch.</p>
    <p class="muted">Each book is printed for you, so please check the name and every page before ordering.</p>
  </div>
  ${errs.length ? `<div class="errorbox" role="alert"><strong>Please fix before ordering:</strong><ul>${errs.map((e) => `<li>${esc(e.message)}</li>`).join('')}</ul></div>` : ''}
  <label class="check"><input type="checkbox" id="approve"> <span>I have looked at every page and the name is spelled the way I want it printed.</span></label>
  ${state.seenAll ? '' : '<p class="muted">You have not reached the last page of the preview yet. <a href="#" id="goto-preview">Go to the preview</a>.</p>'}
  <p class="error" id="order-error" role="alert"></p>
  <div class="actions"><button class="btn" id="add" ${errs.length ? 'disabled' : ''}>Add to cart</button></div>`;
}

function viewMake(titleId) {
  const t = TITLES[titleId];
  if (!t || t.status === 'fixture') return viewHome();
  // Drop choices this title cannot draw, and say so.
  const c = state.character;
  const dropped = [];
  c.supports = c.supports.filter((s) => t.availability.supports[s] || (dropped.push(s), false));
  if (!t.availability.mobility[c.mobility]) { dropped.push(c.mobility); c.mobility = 'none'; }
  if (!t.availability.comfort[c.comfort]) { dropped.push(c.comfort); c.comfort = 'none'; }

  const draw = (focusSel) => {
    keep();
    const book = resolveBook({ titleId: t.id, character: state.character, textSetting: state.textSetting });
    const steps = [['character', '1. Character'], ['preview', '2. Preview the book'], ['order', '3. Cover and order']];
    let panel = '';
    if (state.step === 'character') panel = `<div class="editor"><div class="stage" id="stage">${stageSVG()}<p class="muted" style="text-align:center;margin:6px 0 0">Placeholder drawing · final art will replace it</p></div><div>${characterForm(t)}<div class="actions"><button class="btn" data-step="preview">Preview the book →</button></div></div></div>`;
    else if (state.step === 'preview') panel = `${previewPanel(book)}<div class="actions"><button class="btn ghost" data-step="character">← Change the character</button><button class="btn" data-step="order">Choose the cover →</button></div>`;
    else panel = `${orderPanel(t, book)}`;
    main.innerHTML = `
      <div class="titleswitch"><span class="muted">Same character, different story:</span>${orderable().map((x) => `<a class="btn small ${x.id === t.id ? '' : 'ghost'}" href="#/make/${x.id}" ${x.id === t.id ? 'aria-current="page"' : ''}>${esc(x.short || x.title)}</a>`).join('')}</div>
      <h1>${esc(t.title)}</h1>
      ${dropped.length ? `<p class="note" role="status">Not available in this story yet, so it was removed: ${esc(dropped.join(', '))}.</p>` : ''}
      <ol class="stepper">${steps.map(([id, l]) => `<li><button data-step="${id}" ${state.step === id ? 'aria-current="step"' : ''}>${l}</button></li>`).join('')}</ol>
      <section aria-label="${steps.find((s) => s[0] === state.step)[1]}">${panel}</section>`;
    if (focusSel) $(focusSel)?.focus();
  };

  main.onclick = async (e) => {
    const stepBtn = e.target.closest('[data-step]');
    if (stepBtn) {
      const err = validateName(normalizeCharacter(state.character).name);
      if (err && stepBtn.dataset.step !== 'character') { state.step = 'character'; draw('#name'); $('#name-error').textContent = err; return; }
      state.step = stepBtn.dataset.step; draw(`.stepper [data-step="${state.step}"]`); window.scrollTo(0, 0); return;
    }
    if (e.target.id === 'prev') { state.index--; draw('#prev:not([disabled]), #next'); say($('#where').textContent); }
    if (e.target.id === 'next') { state.index++; draw('#next:not([disabled]), #prev'); say($('#where').textContent); }
    if (e.target.id === 'goto-preview') { e.preventDefault(); state.step = 'preview'; draw('.stepper [aria-current]'); }
    if (e.target.id === 'add') {
      const out = $('#order-error');
      if (!$('#approve').checked) { out.textContent = 'Please tick the box to confirm you have checked every page.'; $('#approve').focus(); return; }
      e.target.disabled = true;
      try {
        const variant = variantFor(t.id, state.binding);
        const book = resolveBook({ titleId: t.id, character: state.character, textSetting: state.textSetting });
        const previewHash = await sha256(fingerprintSource(book, variant.id));
        await backend.addBook({ titleId: t.id, character: state.character, textSetting: state.textSetting, variantId: variant.id, approved: true, previewHash }, variant.id);
        location.hash = '#/cart';
      } catch (err) { out.textContent = err.message; e.target.disabled = false; }
    }
  };
  main.onchange = (e) => {
    const el = e.target;
    if (el.name === 'view') { state.view = el.value; draw(`[name="view"][value="${el.value}"]`); return; }
    if (el.name === 'textSetting') { state.textSetting = el.value; draw(`[name="textSetting"][value="${el.value}"]`); return; }
    if (el.name === 'binding') { state.binding = el.value; draw(`[name="binding"][value="${el.value}"]`); return; }
    if (!el.form || el.form.id !== 'char') return;
    if (el.name === 'supports') state.character.supports = [...el.form.querySelectorAll('[name="supports"]:checked')].map((x) => x.value);
    else if (el.name !== 'name') state.character[el.name] = el.value;
    state.seenAll = false;
    keep();
    $('#stage').firstElementChild.outerHTML = stageSVG();
  };
  main.oninput = (e) => {
    if (e.target.id !== 'name') return;
    state.character.name = e.target.value;
    $('#name-error').textContent = validateName(normalizeCharacter(state.character).name) || '';
    state.seenAll = false;
    keep();
  };
  main.onkeydown = (e) => {
    if (state.step !== 'preview' || state.view !== 'book' || e.target.matches('input, select, textarea')) return;
    if (e.key === 'ArrowRight') $('#next:not([disabled])')?.click();
    if (e.key === 'ArrowLeft') $('#prev:not([disabled])')?.click();
  };
  draw();
}

// ---- cart / checkout / order ------------------------------------------------------
async function viewCart() {
  const cart = await refreshCart();
  if (!cart.items.length) { const e = ASSETS.files['nub-site-empty']; main.innerHTML = `<h1>Your cart</h1>${e ? `<img src="${esc(e.url)}" alt="" width="180" height="180">` : ''}<p>Your cart is empty.</p><p><a class="btn" href="#/">Choose a story</a></p>`; return; }
  const bad = cart.items.some((i) => i.nub.problem);
  main.innerHTML = `<h1>Your cart</h1>
  <div class="scroll"><table><thead><tr><th scope="col">Book</th><th scope="col">Cover</th><th scope="col">Copies</th><th scope="col">Price</th><th scope="col"><span class="sr">Remove</span></th></tr></thead><tbody>
  ${cart.items.map((i) => `<tr><td><strong>${esc(i.title)}</strong>${i.nub.name ? `<br>for ${esc(i.nub.name)}` : ''}${i.nub.problem ? `<br><span class="error">${esc(i.nub.problem)}</span>` : ''}</td><td>${esc(i.variant_title)}</td>
    <td><label class="sr" for="q-${i.key}">Copies of ${esc(i.title)}</label><select id="q-${i.key}" data-qty="${i.key}" style="width:5em">${[1, 2, 3, 4, 5].map((q) => `<option ${q === i.quantity ? 'selected' : ''}>${q}</option>`).join('')}</select></td>
    <td>${money(i.line_price)}</td><td><button class="btn small ghost" data-remove="${i.key}">Remove<span class="sr"> ${esc(i.title)}</span></button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="totals"><div><span>Subtotal</span><span>${money(cart.total_price)}</span></div><div><span>Shipping (sample)</span><span>${money(CONFIG.sampleShippingCents)}</span></div><div class="grand"><span>Total</span><span>${money(cart.total_price + CONFIG.sampleShippingCents)}</span></div></div>
  <div class="actions"><a class="btn ghost" href="#/">Add another book</a><a class="btn" href="${backend.features.testCheckout ? '#/checkout' : backend.checkoutUrl || '#/cart'}" ${bad || (!backend.features.testCheckout && !backend.checkoutUrl) ? 'aria-disabled="true" style="pointer-events:none;opacity:.55"' : ''}>${backend.features.testCheckout ? 'Checkout (test)' : 'Checkout'}</a></div>
  ${backend.features.simulated ? '<p class="note"><strong>Draft:</strong> the Next Up Books products are not active in this store yet, so this cart is a stand-in kept in your browser and checkout is switched off. Once test products are active, this becomes the store\u2019s real cart.</p>' : ''}
  <p class="note">The book design travels with each cart line as a hidden reference code only. Names and choices are never placed in the cart, the order, or analytics.</p>`;
  main.onclick = async (e) => { const k = e.target.closest('[data-remove]')?.dataset.remove; if (k) { await backend.changeQty(k, 0); say('Book removed'); viewCart(); } };
  main.onchange = async (e) => { const k = e.target.dataset.qty; if (k) { await backend.changeQty(k, Number(e.target.value)); viewCart(); } };
  main.oninput = main.onkeydown = null;
}

async function viewCheckout() {
  const cart = await refreshCart();
  if (!cart.items.length) { location.hash = '#/cart'; return; }
  main.innerHTML = `<h1>Checkout <span class="tag warn">Test mode</span></h1>
  <p class="note">This stands in for Shopify checkout. The details below are made-up sample data and no payment is taken.</p>
  <form id="co"><fieldset><legend>Contact and delivery (sample data)</legend><div class="formgrid">
    <div><label class="field" for="email">Email</label><input type="email" id="email" value="sample.buyer@example.com" required></div>
    <div><label class="field" for="nm">Full name</label><input type="text" id="nm" value="Sample Buyer" required></div>
    <div><label class="field" for="a1">Address</label><input type="text" id="a1" value="100 Example Street" required></div>
    <div><label class="field" for="city">City</label><input type="text" id="city" value="Sampletown" required></div>
    <div><label class="field" for="st">State</label><input type="text" id="st" value="MD" required></div>
    <div><label class="field" for="zip">ZIP</label><input type="text" id="zip" value="00000" required></div>
  </div></fieldset>
  <fieldset><legend>Payment</legend><p>Test payment · sample card ending 0001 · <strong>${money(cart.total_price + CONFIG.sampleShippingCents)}</strong></p></fieldset>
  <p class="error" id="co-error" role="alert"></p>
  <div class="actions"><a class="btn ghost" href="#/cart">← Back to cart</a><button class="btn" type="submit">Place test order</button></div></form>`;
  main.onclick = main.onchange = main.oninput = main.onkeydown = null;
  $('#co').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/api/checkout', { method: 'POST', body: { email: $('#email').value, shipping_address: { name: $('#nm').value, address1: $('#a1').value, city: $('#city').value, province: $('#st').value, zip: $('#zip').value } } });
      save('nub.lastOrder', r);
      location.hash = `#/order/${r.order.id}`;
    } catch (err) { $('#co-error').textContent = err.message; }
  };
}

const statusTag = (s) => `<span class="tag ${s === 'awaiting_review' || s === 'released' ? 'ok' : 'warn'}">${esc(s.replace(/_/g, ' '))}</span>`;

async function viewOrder() {
  await refreshCart();
  const r = load('nub.lastOrder', null);
  if (!r) { main.innerHTML = '<h1>Order</h1><p>No test order in this tab yet.</p>'; return; }
  main.innerHTML = `<h1>Thank you — test order ${esc(r.order.name)}</h1>
  <p>A simulated “order paid” message was sent to the production side, which created one print job per book.</p>
  <div class="scroll"><table><thead><tr><th scope="col">Book</th><th scope="col">Cover</th><th scope="col">Copies</th><th scope="col">Print job</th><th scope="col">Proof</th></tr></thead><tbody>
  ${r.order.line_items.map((l) => { const rec = r.records.find((x) => x.lineId === l.id); return `<tr><td>${esc(l.title)}</td><td>${esc(l.variant_title)}</td><td>${l.quantity}</td><td>${rec ? statusTag(rec.status) : '—'}</td><td>${rec?.designId ? `<a href="/proof/${rec.designId}" target="_blank" rel="noopener">Open proof<span class="sr"> (new tab)</span></a>` : '—'}</td></tr>`; }).join('')}
  </tbody></table></div>
  <div class="totals"><div><span>Subtotal</span><span>${money(r.order.subtotal_price)}</span></div><div><span>Shipping (sample)</span><span>${money(r.order.shipping_price)}</span></div><div class="grand"><span>Total (not charged)</span><span>${money(r.order.total_price)}</span></div></div>
  <div class="actions"><a class="btn" href="#/ops">See the review queue</a><a class="btn ghost" href="#/">Make another book</a></div>`;
  main.onclick = main.onchange = main.oninput = main.onkeydown = null;
}

async function viewOps(msg = '') {
  const { records } = await api('/api/ops/queue');
  main.innerHTML = `<h1>Review queue <span class="tag">staff view · dev only</span></h1>
  <p class="muted">Every paid book lands here for a person to check before it goes to print at Linemark. Nothing is sent to a production system from this prototype.</p>
  ${msg ? `<p class="note" role="status">${esc(msg)}</p>` : ''}
  <div class="scroll"><table><thead><tr><th scope="col">Order</th><th scope="col">SKU</th><th scope="col">Copies</th><th scope="col">Status</th><th scope="col">Referral</th><th scope="col">Actions</th></tr></thead><tbody>
  ${records.length ? records.map((r) => `<tr><td>${esc(r.orderName)}<br><span class="muted">line ${r.lineId}</span></td><td>${esc(r.sku)}</td><td>${r.quantity}</td><td>${statusTag(r.status)}${r.holdReason ? `<br><span class="error">${esc(r.holdReason)}</span>` : ''}</td><td>${esc(r.ref || '—')}</td>
    <td><div class="actions" style="margin:0">${r.proofUrl ? `<a class="btn small ghost" href="${r.proofUrl}" target="_blank" rel="noopener">Proof</a>` : ''}${r.status === 'awaiting_review' ? `<button class="btn small" data-act="release" data-key="${r.key}">Release (mock)</button>` : ''}<button class="btn small ghost" data-act="replay" data-order="${r.orderId}">Resend paid message</button><button class="btn small ghost" data-act="refund" data-order="${r.orderId}">Refund / cancel</button></div></td></tr>`).join('') : '<tr><td colspan="6">No print jobs yet. Place a test order first.</td></tr>'}
  </tbody></table></div>
  <div class="actions"><button class="btn ghost" data-act="bad">Simulate a paid order with a missing design</button></div>`;
  main.onchange = main.oninput = main.onkeydown = null;
  main.onclick = async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    try {
      if (b.dataset.act === 'release') { await api('/api/ops/release', { method: 'POST', body: { key: b.dataset.key } }); viewOps('Marked as released. (Mock only — no file was sent anywhere.)'); }
      if (b.dataset.act === 'replay') { const r = await api('/api/ops/replay', { method: 'POST', body: { orderId: b.dataset.order } }); viewOps(r.duplicate ? 'Duplicate message ignored — no second print job was created.' : `Message processed; ${r.created} new job(s).`); }
      if (b.dataset.act === 'refund') { await api('/api/ops/refund', { method: 'POST', body: { orderId: b.dataset.order } }); viewOps('Order refunded: jobs not yet released were cancelled.'); }
      if (b.dataset.act === 'bad') { await api('/api/ops/simulate-bad', { method: 'POST' }); viewOps('A paid order arrived without a valid design, so its job is on hold.'); }
    } catch (err) { viewOps(err.message); }
  };
}

function viewContent() {
  const fx = TITLES.fixture;
  const c = normalizeCharacter({ name: 'Sam' });
  let fixture = '';
  if (fx) {
    const p = fx.pages[0];
    const art = renderArt(fx, p, c, fillTokens(p.alt, c));
    fixture = `<div style="max-width:420px">${pageHTML({ id: p.id, style: 'panel', folio: 1, body: resolveText(p, c).body, art: art.svg, placeholder: art.placeholder })}</div>`;
  }
  const rows = orderable().map((t) => {
    const slots = [...t.pages.map((p) => p.id), 'cover-front', 'cover-back'];
    const have = slots.filter((id) => ASSETS.files[`nub-${t.code}-${id}-bg`]).length;
    return `<tr><td>${esc(t.title)}</td><td>${t.pages.length}</td><td>${have} of ${slots.length}</td><td>${esc(t.copyStatus || '')}</td><td>${esc(t.storyVersion)}</td></tr>`;
  }).join('');
  const chars = Object.keys(ASSETS.files).filter((n) => n.startsWith('nub-char-v1-')).length;
  main.innerHTML = `<h1>Content status <span class="tag">dev only</span></h1>
  <p>Finished art is picked up by file name from the <code>content/</code> folder. Anything missing shows as a labeled placeholder. See <code>docs/ASSET_SPEC.md</code>.</p>
  ${state.problems.length ? `<div class="errorbox"><strong>Content problems</strong><ul>${state.problems.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
  <div class="scroll"><table><thead><tr><th scope="col">Title</th><th scope="col">Story pages</th><th scope="col">Finished page art</th><th scope="col">Words</th><th scope="col">Version</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="muted">Finished character layers found: ${chars}. Content fingerprint: ${esc(ASSETS.digest)}.</p>
  <h2>Layering test with the supplied classroom art</h2>
  <p class="muted">The classroom background and the child cutout are two separate files, stacked by the same renderer the books use, with the words kept as live text.</p>
  ${fixture}`;
  main.onclick = main.onchange = main.oninput = main.onkeydown = null;
}

// ---- boot -----------------------------------------------------------------------
async function route() {
  const [, name, arg] = location.hash.split('/');
  main.onclick = main.onchange = main.oninput = main.onkeydown = null;
  if (name === 'make') viewMake(arg);
  else if (name === 'cart') await viewCart();
  else if (name === 'checkout' && backend.features.testCheckout) await viewCheckout();
  else if (name === 'order' && backend.features.testCheckout) await viewOrder();
  else if (name === 'ops' && backend.features.ops) await viewOps();
  else if (name === 'content') viewContent();
  else viewHome();
  if (name !== 'make') window.scrollTo(0, 0);
}

const data = await backend.catalog();
registerCatalog(data);
state.problems = data.problems || [];
const logoEl = document.querySelector('.nub-logo-slot, header.site .logo');
if (logoEl && ASSETS.files['nub-logo'] && !logoEl.querySelector('img')) logoEl.innerHTML = `<img src="${esc(ASSETS.files['nub-logo'].url)}" alt="Next Up Books" style="display:block;height:40px;width:auto">`;
const ref = new URLSearchParams(location.search).get('ref');
if (ref && PARTNERS[ref]) { save('nub.ref', ref); await backend.setRef(ref); }
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/make')) state.step = 'character'; route(); });
await refreshCart();
route();
