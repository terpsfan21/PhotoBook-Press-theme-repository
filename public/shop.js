// Next Up Books — shop pages: site chrome, home page, product pages, info pages.
//
// These pages are planned around PHOTOS OF THE REAL PRINTED BOOKS. Each photo
// has a named slot (see docs/PHOTO_SHOOT.md). Until a photo file exists, the
// slot shows a mockup built from the real page art, tagged "Mockup".
import { TITLES, CONCEPTS, PARTNERS, ASSETS, BINDINGS, OPTIONS, money } from '../shared/catalog.js';
import { resolveBook, pageHTML, esc } from '../shared/render.js';

const F = () => ASSETS.files;
const orderable = () => Object.values(TITLES).filter((t) => t.status !== 'fixture');
const img = (name, alt, cls = '') => (F()[name] ? `<img class="${cls}" src="${esc(F()[name].url)}" alt="${esc(alt)}" loading="lazy">` : '');
const MOCK = '<span class="mock-tag">Mockup · photo to come</span>';

/** The character a visitor has already made (or the default), so mockups show their child. */
let getCharacter = () => ({});
const book = (t) => resolveBook({ titleId: t.id, character: getCharacter(), textSetting: 'std' });
const page = (p) => pageHTML(p, { placeholderLabel: false });

// ---- mockups (stand-ins for product photos) ---------------------------------
const coverMock = (t, binding = 'hardcover') => `<div class="bookmock ${binding}" aria-hidden="true"><div class="face">${page(book(t).cover.front)}</div></div>`;
function spreadMock(t) {
  const b = book(t);
  return `<div class="openbook" aria-hidden="true">${page(b.pages[1])}${page(b.pages[2])}</div>`;
}
const pairMock = (t) => `<div class="pair">${['softcover', 'hardcover'].map((k) => `<figure>${coverMock(t, k)}<figcaption>${BINDINGS[k].label}</figcaption></figure>`).join('')}</div>`;
const tile = (text) => `<div class="phototile"><span>${esc(text)}</span></div>`;

/** A photo slot: the real photo when its file exists, otherwise a tagged mockup. */
function slot(name, alt, fallback) {
  return `<div class="slot">${img(name, alt) || `${fallback}${MOCK}`}</div>`;
}

const FAQ = [
  ['Can I see the whole book before I pay?', 'Yes. You read every page on screen, with your child’s name and character, before you add the book to your cart.'],
  ['Do I need to upload a photo of my child?', 'No. You build an illustrated character by choosing skin tone, hair, outfit and the things your child uses, such as glasses, hearing aids, ear defenders or an AAC device. We never ask for a photo, a birthday or a diagnosis.'],
  ['What ages are the books for?', 'They are written for children of about 4 to 9, with short sentences and one idea per page. There is also an easy-to-read setting with fewer words in larger type.'],
  ['What size are the books?', 'Every book is 8.5 × 8.5 inches with 24 story pages, in softcover or hardcover.'],
  ['How long will my book take?', 'Each book is printed to order by Linemark. Printing and delivery times will be confirmed here before we launch.'],
  ['Is this therapy or medical advice?', 'No. It is a picture book to read together so a child can see what a first experience might be like. Every visit is different, so we encourage asking the dentist or stylist what to expect.'],
];
const faqHTML = () => `<div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

function stepsHTML() {
  const pic = (n) => img(`nub-site-step-${n}`, '');
  return `<ol class="howsteps">
    <li>${pic(1)}<h3>1. Choose a story</h3><p>Start with a first dentist visit or a first haircut.</p></li>
    <li>${pic(2)}<h3>2. Make the character</h3><p>Add a name and choose the look, the outfit and the things that help.</p></li>
    <li>${pic(3)}<h3>3. Read it, then order</h3><p>See every page first. Then pick softcover or hardcover.</p></li>
  </ol>`;
}

// ---- site chrome ---------------------------------------------------------------
export function renderChrome(features) {
  const header = document.querySelector('.nub-app header.site, header.site');
  const footer = document.querySelector('.nub-app footer.site, footer.site');
  const logo = F()['nub-logo'] ? `<img src="${esc(F()['nub-logo'].url)}" alt="Next Up Books" width="224" height="40">` : 'Next Up <span>Books</span>';
  if (header) {
    header.innerHTML = `<a class="logo" href="#/">${logo}</a>
    <nav aria-label="Main"><a href="#/books">Books</a><a href="#/how">How it works</a><a href="#/about">Our approach</a><a href="#/faq">Questions</a></nav>
    <a class="cartlink" href="#/cart" id="cart-link">Cart (0)</a>`;
  }
  if (footer) {
    footer.innerHTML = `<div class="footcols">
      <div><h3>Books</h3>${orderable().map((t) => `<a href="#/books/${t.id}">${esc(t.title)}</a>`).join('')}</div>
      <div><h3>Help</h3><a href="#/how">How it works</a><a href="#/faq">Questions</a><a href="#/cart">Cart</a></div>
      <div><h3>About</h3><a href="#/about">Our approach</a><span>Printed and bound by Linemark in the USA</span></div>
    </div>
    <p>For grown-ups: this is a picture book that helps a child see what a first experience might be like. It is not medical or therapeutic advice.</p>
    <p class="devlinks">Draft build · ${features.ops ? '<a href="#/ops">Review queue</a> · ' : ''}<a href="#/content">Content status</a></p>`;
  }
}

// ---- home ----------------------------------------------------------------------
export function viewHome(main, ctx) {
  getCharacter = ctx.character;
  const titles = orderable();
  const lead = titles[0];
  const ref = PARTNERS[ctx.ref];
  const from = money(Math.min(...Object.values(BINDINGS).map((b) => b.priceCents)));
  const opts = [...OPTIONS.supports.map((o) => [`nub-site-opt-${o.id}`, o.label]), ['nub-site-opt-wheelchair', 'Wheelchair'], ['nub-site-opt-bunny', 'Comfort toy']];
  main.innerHTML = `
  <section class="hero2">
    <div class="hero2-text">
      <h1>A little story for a big first.</h1>
      <p class="lead">A personalized picture book that shows your child what a first dentist visit or haircut might be like, before the day comes.</p>
      ${ref ? `<p class="tag ok">Shared with you by ${esc(ref.name)}</p>` : ''}
      <p class="cta"><a class="btn big" href="#/books">Choose a story</a><a class="textlink" href="#/how">How it works</a></p>
      <ul class="ticks"><li>Read every page before you order</li><li>Softcover or hardcover, 8.5 × 8.5 in</li><li>No photo of your child needed</li></ul>
    </div>
    <div class="hero2-photo">${slot('nub-site-photo-hero', 'Next Up Books on a table: a hardcover and a softcover copy', `<div class="heromock">${coverMock(lead, 'hardcover')}${titles[1] ? coverMock(titles[1], 'softcover') : ''}</div>`)}</div>
  </section>

  <section aria-labelledby="h-books">
    <div class="sechead"><h2 id="h-books">Shop the books</h2><a class="textlink" href="#/books">See all</a></div>
    ${booksGrid()}
  </section>

  <section class="band" aria-labelledby="h-how"><h2 id="h-how">Three simple steps</h2>${stepsHTML()}</section>

  <section class="split" aria-labelledby="h-char">
    <div>${img('nub-social-square-3', 'Three different illustrated children waving: one with glasses, one with ear defenders, one with an AAC device', 'rounded') || tile('Example characters')}</div>
    <div>
      <h2 id="h-char">Made to look like your child</h2>
      <p>Choose skin tone, hair and outfit, then add what your child uses every day. The same character can star in every book.</p>
      <ul class="optrow">${opts.map(([n, l]) => `<li>${img(n, '')}<span>${esc(l)}</span></li>`).join('')}</ul>
      <p><a class="btn" href="#/make/${lead.id}">Make your character</a></p>
    </div>
  </section>

  <section class="split rev" aria-labelledby="h-inside">
    <div>${slot('nub-site-photo-spread', 'An open Next Up book showing two story pages', spreadMock(lead))}</div>
    <div>
      <h2 id="h-inside">A real book to hold</h2>
      <p>Full-page pictures with a few read-aloud words at the bottom of each page. One idea at a time, with ways to ask a question or take a pause.</p>
      <ul class="ticks"><li>24 story pages</li><li>8.5 × 8.5 inches, easy for small hands</li><li>Printed and bound by Linemark in the USA</li></ul>
      <p><a class="textlink" href="#/books/${lead.id}">Look inside ${esc(lead.title)}</a></p>
    </div>
  </section>

  <section class="photoband" aria-label="Reading together">
    ${img('nub-site-hero-desktop', 'A child and a grown-up reading a picture book together on a sofa')}
    <div><h2>Read it together, as many times as you like.</h2><p><a class="btn" href="#/books">Choose a story</a></p></div>
  </section>

  <section aria-labelledby="h-faq" class="narrow"><h2 id="h-faq">Questions</h2>${faqHTML()}</section>`;
}

function booksGrid() {
  const from = money(Math.min(...Object.values(BINDINGS).map((b) => b.priceCents)));
  return `<ul class="products">
    ${orderable().map((t) => `<li><a class="product" href="#/books/${t.id}">
      ${slot(`nub-${t.code}-photo-cover`, `${t.title}, printed book`, `<div class="stagebg">${coverMock(t)}</div>`)}
      <h3>${esc(t.title)}</h3><p class="muted">${esc(t.blurb)}</p><p class="pricefrom">From ${from}</p><span class="btn small">View book</span></a></li>`).join('')}
    ${CONCEPTS.map((c) => `<li><div class="product soon"><div class="slot">${c.image ? `<img src="${esc(c.image)}" alt="Illustration for ${esc(c.title)}" loading="lazy">` : ''}</div><h3>${esc(c.title)}</h3><p><span class="tag">${esc(c.note)}</span></p></div></li>`).join('')}
  </ul>`;
}

export function viewBooks(main, ctx) {
  getCharacter = ctx.character;
  main.innerHTML = `<h1>Books</h1><p class="lead">First Experiences: picture books that show what a first might be like. Each one stars the character you make.</p>${booksGrid()}`;
}

// ---- product page ----------------------------------------------------------------
export function viewBook(main, ctx, id) {
  getCharacter = ctx.character;
  const t = TITLES[id];
  if (!t || t.status === 'fixture') return viewBooks(main, ctx);
  const b = book(t);
  const c = t.code;
  const media = [
    ['Cover', slot(`nub-${c}-photo-cover`, `${t.title}: front cover of the printed book`, `<div class="stagebg">${coverMock(t)}</div>`)],
    ['Open book', slot(`nub-${c}-photo-spread`, `${t.title}: the printed book open at two story pages`, `<div class="stagebg">${spreadMock(t)}</div>`)],
    ['In hand', slot(`nub-${c}-photo-hand`, `${t.title} held in a child’s hands`, tile('Photo to come: the book in a child’s hands, to show its size'))],
    ['Cover types', slot(`nub-${c}-photo-binding`, `${t.title}: softcover and hardcover copies side by side`, `<div class="stagebg">${pairMock(t)}</div>`)],
    ['Flip-through', F()[`nub-${c}-flip`] ? `<div class="slot"><video controls preload="metadata" ${F()[`nub-${c}-flip-poster`] ? `poster="${esc(F()[`nub-${c}-flip-poster`].url)}"` : ''} src="${esc(F()[`nub-${c}-flip`].url)}"></video></div>` : `<div class="slot">${tile('Video to come: a short flip through the printed book')}${MOCK}</div>`],
  ];
  const sample = [b.pages[1], b.pages[2], b.pages[13], b.pages[19]].filter(Boolean);
  main.innerHTML = `
  <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <a href="#/books">Books</a> / <span aria-current="page">${esc(t.title)}</span></nav>
  <div class="pdp">
    <div class="gallery">
      <div class="viewer" id="viewer">${media[0][1]}</div>
      <div class="thumbs" role="group" aria-label="Product pictures">${media.map(([label], i) => `<button type="button" data-media="${i}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('')}</div>
    </div>
    <div class="buybox">
      <h1>${esc(t.title)}</h1>
      <p class="lead">${esc(t.blurb)}</p>
      <div class="prices">${Object.values(BINDINGS).map((x) => `<div><strong>${x.label}</strong><span>${money(x.priceCents)}</span></div>`).join('')}</div>
      <p><a class="btn big wide" href="#/make/${t.id}">Personalize this book</a></p>
      <ul class="ticks"><li>Read every page before you order</li><li>24 story pages, 8.5 × 8.5 in</li><li>Name, look, and supports your child uses</li><li>Standard or easy-to-read words</li></ul>
      <p class="muted">You choose softcover or hardcover after you have seen the whole book. Shipping and delivery time are shown before you pay.</p>
    </div>
  </div>

  <section aria-labelledby="h-pages"><h2 id="h-pages">A few pages from the story</h2>
    <ul class="samplepages">${sample.map((p) => `<li>${page(p)}</li>`).join('')}</ul>
    <p class="muted">These show ${getCharacter().name ? `the character you made for ${esc(getCharacter().name)}` : 'an example character'}. Pages still waiting for finished illustrations show simple stand-in drawings.</p>
  </section>

  <section class="split" aria-labelledby="h-story">
    <div><h2 id="h-story">What the story covers</h2><ol class="outline">${t.pages.filter((_, i) => [1, 4, 7, 10, 13, 18, 22].includes(i)).map((p) => `<li>${esc((p.text.noName?.std || p.text.std).replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').trim())}</li>`).join('')}</ol></div>
    <div><h2>Details</h2><table class="specs"><tbody>
      <tr><th scope="row">Size</th><td>8.5 × 8.5 inches</td></tr>
      <tr><th scope="row">Pages</th><td>${t.pages.length} story pages, full-page pictures</td></tr>
      <tr><th scope="row">Covers</th><td>Softcover ${money(BINDINGS.softcover.priceCents)} · Hardcover ${money(BINDINGS.hardcover.priceCents)}</td></tr>
      <tr><th scope="row">Words</th><td>Read-aloud text at the bottom of each page; easy-to-read option</td></tr>
      <tr><th scope="row">Made by</th><td>Printed and bound to order by Linemark in the USA</td></tr>
    </tbody></table></div>
  </section>

  <section class="band" aria-labelledby="h-how2"><h2 id="h-how2">How personalizing works</h2>${stepsHTML()}<p style="text-align:center"><a class="btn big" href="#/make/${t.id}">Personalize this book</a></p></section>
  <section class="narrow" aria-labelledby="h-faq2"><h2 id="h-faq2">Questions</h2>${faqHTML()}</section>`;
  main.onclick = (e) => {
    const btn = e.target.closest('[data-media]');
    if (!btn) return;
    document.getElementById('viewer').innerHTML = media[Number(btn.dataset.media)][1];
    main.querySelectorAll('[data-media]').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
  };
}

// ---- info pages ----------------------------------------------------------------
export function viewInfo(main, ctx, which) {
  getCharacter = ctx.character;
  const lead = orderable()[0];
  if (which === 'how') {
    main.innerHTML = `<h1>How it works</h1><p class="lead">From choosing a story to a printed book, in three steps.</p>${stepsHTML()}
    <section class="split"><div>${slot('nub-site-photo-pair', 'A softcover and a hardcover Next Up book side by side', `<div class="stagebg">${pairMock(lead)}</div>`)}</div>
    <div><h2>Softcover or hardcover</h2><p>Both are 8.5 × 8.5 inches with the same 24 story pages. Softcover is light to carry to the appointment. Hardcover stands up to many re-reads.</p><p><a class="btn" href="#/books">Choose a story</a></p></div></section>`;
  } else if (which === 'about') {
    main.innerHTML = `<h1>Our approach</h1>
    <section class="split"><div>${img('nub-site-about', 'Grown-ups and a child looking at a picture book together', 'rounded')}</div>
    <div><p class="lead">New things are easier when you know what is coming.</p>
    <p>Next Up Books show a child what they might see, hear and do the first time, with their own character on every page. The words are short and honest: they say what <em>may</em> happen, and they give a child ways to ask a question or take a pause.</p>
    <p>The books are made to be welcoming for every child, and especially for children who like to know the plan, including autistic children and children with sensory or communication differences.</p>
    <p class="note"><strong>Draft:</strong> this page will name the autistic reviewers and the professionals who review each story once those reviews are complete.</p></div></section>`;
  } else {
    main.innerHTML = `<h1>Questions</h1><div class="narrow">${faqHTML()}</div>`;
  }
}
