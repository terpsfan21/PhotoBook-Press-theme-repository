// Next Up Books — shared composition. One code path resolves a design into
// pages (art layers + live text) for BOTH the storefront preview and the
// server-side proof, so the approved preview and the output cannot drift.
import { renderCharacter, CHARACTER_REVISION, AGE_BANDS, expectedSupportMarkers, resolvePose } from './character.js';
import { BACKGROUNDS, PROPS, iconCards, ART_REVISION } from './scenes.js';
import { TITLES, ASSETS, OPTIONS, BINDINGS, CONFIG, DEFAULT_CHARACTER, NAME_MAX, NAME_PATTERN, variantById } from './catalog.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const PRONOUNS = {
  she: { they: 'she', them: 'her', their: 'her', plural: false },
  he: { they: 'he', them: 'him', their: 'his', plural: false },
  they: { they: 'they', them: 'them', their: 'their', plural: true },
};
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Clean and order a character so equal choices always serialise equally. */
export function normalizeCharacter(input = {}) {
  const c = { ...DEFAULT_CHARACTER, ...input };
  const known = OPTIONS.supports.map((o) => o.id);
  return {
    name: String(c.name || '').normalize('NFC').replace(/\s+/g, ' ').trim(),
    pronouns: c.pronouns || 'none',
    ageBand: c.ageBand || '',
    skin: c.skin, hairStyle: c.hairStyle, hairColor: c.hairColor, eyes: c.eyes, outfit: c.outfit,
    supports: [...new Set(c.supports || [])].filter((s) => known.includes(s)).sort(),
    mobility: c.mobility || 'none',
    comfort: c.comfort || 'none',
  };
}

export function validateName(name) {
  if (!name) return null; // optional
  if ([...name].length > NAME_MAX) return `Use ${NAME_MAX} characters or fewer for the name.`;
  if (!NAME_PATTERN.test(name)) return 'Use letters, spaces, hyphens, apostrophes or periods in the name.';
  return null;
}

/** Validate a design request. Returns a list of { field, message }. */
export function validateDesign(input) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const m = TITLES[input?.titleId];
  if (!m) return [{ field: 'titleId', message: 'Unknown title.' }];
  if (m.status === 'fixture') return [{ field: 'titleId', message: 'This title is a test fixture and cannot be ordered.' }];
  const c = normalizeCharacter(input.character);
  const nameError = validateName(c.name);
  if (nameError) add('name', nameError);
  for (const key of ['pronouns', 'ageBand', 'skin', 'hairStyle', 'hairColor', 'eyes', 'outfit', 'mobility', 'comfort']) {
    if (!OPTIONS[key].some((o) => o.id === c[key])) add(key, `Choose one of the listed ${key} options.`);
  }
  for (const s of c.supports) if (!m.availability.supports[s]) add('supports', `"${s}" is not available in ${m.title} yet.`);
  if (!m.availability.mobility[c.mobility]) add('mobility', `That mobility aid does not have art in ${m.title} yet.`);
  if (!m.availability.comfort[c.comfort]) add('comfort', `That comfort item is not available in ${m.title} yet.`);
  if (!['std', 'easy'].includes(input.textSetting || 'std')) add('textSetting', 'Unknown text setting.');
  if (input.variantId != null) {
    const v = variantById(input.variantId);
    if (!v || v.titleId !== m.id) add('variantId', 'Choose softcover or hardcover for this title.');
    else {
      const spec = BINDINGS[v.binding].spec;
      // Never pad a story or swap bindings silently: refuse instead.
      if (!spec.allowedPageCounts.includes(m.pages.length)) add('variantId', `${BINDINGS[v.binding].label} cannot take a ${m.pages.length}-page interior.`);
    }
  }
  if (m.pages.length !== m.interiorPageCount || m.pages.length < CONFIG.pageCountRange[0] || m.pages.length > CONFIG.pageCountRange[1]) {
    add('titleId', 'This title has an unsupported page count.');
  }
  return errors;
}

function matches(when, c) {
  if (when.mobility && c.mobility !== when.mobility) return false;
  if (when.support && !c.supports.includes(when.support)) return false;
  if (when.pronouns && c.pronouns !== when.pronouns) return false;
  if (when.comfort && c.comfort === 'none') return false;
  return true;
}

/** Fill tokens: {name} {Name} {child} {they} {them} {their} {They} {Their} {v:singular|plural}. */
export function fillTokens(tpl, c) {
  const p = PRONOUNS[c.pronouns];
  const name = c.name;
  const map = {
    name: name || 'your child',
    Name: name || 'Your child',
    child: name || 'A child',
    they: p ? p.they : name || 'your child',
    them: p ? p.them : name || 'your child',
    their: p ? p.their : 'the',
  };
  return tpl.replace(/\{(v):([^|}]*)\|([^}]*)\}|\{(\w+)\}/g, (all, v, sing, plur, key) => {
    if (v) return p && p.plural ? plur : sing;
    if (key in map) return map[key];
    const lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (lower in map) return cap1(map[lower]);
    return all;
  });
}

/** Pick and fill the copy for one page. Order: matching variant → no-name → base. */
export function resolveText(page, c, setting = 'std') {
  const slot = page.text || {};
  let src = slot;
  const variant = (slot.variants || []).find((v) => matches(v.when, c));
  if (variant) src = variant;
  else if (!c.name && slot.noName) src = slot.noName;
  const body = src[setting] ?? src.std ?? '';
  return { title: slot.title || null, body: fillTokens(body, c) };
}

function castMember(manifest, who, c) {
  const preset = { ...(manifest.cast[who] || {}) };
  for (const key of preset.inherit || []) preset[key] = c[key];
  delete preset.inherit;
  return preset;
}

// ---- finished-art lookup -------------------------------------------------
// ASSETS.files maps a file's base name (no extension) to { url, w, h }.
const asset = (name) => ASSETS.files[name] || null;
// Character canvas: 1500 × 2250 px = 300 × 450 units, feet anchor at (150, 420).
const CHAR_BOX = 'x="-150" y="-420" width="300" height="450"';

/** Painted character layers for one pose, or null if any required file is missing. */
function paintedChild(c, layer) {
  const pose = resolvePose(c, layer.pose);
  const pre = `nub-char-v1-${pose}-`;
  const need = [];
  const opt = (part, support) => { const a = asset(pre + part); if (a) need.push([a, support]); };
  const req = (part, support) => { const a = asset(pre + part); need.push([a, support]); };
  if (c.mobility === 'wheelchair') req('mobility-wheelchair', 'wheelchair');
  opt(`hairback-${c.hairStyle}-${c.hairColor}`);
  req(`body-${c.skin}`);
  req(`outfit-${c.outfit}`);
  opt(`eyes-${c.eyes}`);
  req(`hair-${c.hairStyle}-${c.hairColor}`);
  if (layer.wear) req(`wear-${layer.wear}`);
  for (const sup of c.supports) req(`acc-${sup}`, sup);
  if (c.comfort !== 'none') req(`comfort-${c.comfort}`, 'comfort');
  if (need.some(([a]) => !a)) return null;
  return need.map(([a, sup]) => `<image href="${esc(a.url)}" ${CHAR_BOX}${sup ? ` data-support="${sup}"` : ''}/>`).join('');
}

/**
 * Compose the art for one page. Finished files are used when present
 * (matched by name); anything missing falls back to labeled placeholder art.
 * Returns { svg, placeholder }.
 */
export function renderArt(manifest, page, c, alt = '') {
  const band = AGE_BANDS[c.ageBand] || AGE_BANDS['6-7'];
  const inChair = c.mobility === 'wheelchair';
  const base = `nub-${manifest.code}-${page.id}`;
  const bgFile = (inChair && asset(`${base}-bg-wheelchair`)) || asset(`${base}-bg`);
  const fgFile = asset(`${base}-fg`);
  const bleed = (CONFIG.bleedIn / CONFIG.trimIn) * 1000;
  let placeholder = !bgFile;
  let s = `<svg class="nub-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="${esc(alt)}" preserveAspectRatio="xMidYMid slice">`;
  // A finished background plate already contains the room, props and other
  // people, and is supplied with bleed; the preview shows the trimmed area.
  if (bgFile) s += `<image href="${esc(bgFile.url)}" x="${(-bleed).toFixed(2)}" y="${(-bleed).toFixed(2)}" width="${(1000 + 2 * bleed).toFixed(2)}" height="${(1000 + 2 * bleed).toFixed(2)}" preserveAspectRatio="xMidYMid slice"/>`;
  for (const layer of page.layers) {
    if (layer.hideWhen === 'wheelchair' && inChair) continue;
    if (layer.type === 'child') {
      const at = inChair && layer.wheelchairAt ? layer.wheelchairAt : layer.at;
      const k = (layer.scale || 1.15) * band.scale;
      const painted = paintedChild(c, layer);
      if (!painted) placeholder = true;
      s += `<g data-layer="child" transform="translate(${at[0]} ${at[1]}) scale(${(layer.flip ? -k : k).toFixed(3)} ${k.toFixed(3)})">${painted || renderCharacter(c, { pose: layer.pose, wear: layer.wear, mouth: layer.mouth, look: layer.look })}</g>`;
    } else if (layer.type === 'image') {
      // A single pre-drawn cutout, anchored bottom-centre (used by the layering fixture).
      const a = asset(layer.file);
      if (a) {
        const h = layer.height;
        const w = (h * a.w) / a.h;
        s += `<image href="${esc(a.url)}" x="${(layer.at[0] - w / 2).toFixed(1)}" y="${(layer.at[1] - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
      }
    } else if (bgFile) {
      continue; // placeholder scenery is replaced by the finished plate
    } else if (layer.type === 'bg') {
      s += BACKGROUNDS[layer.id](layer.params || {});
    } else if (layer.type === 'prop') {
      s += `<g transform="translate(${layer.at[0]} ${layer.at[1]}) scale(${layer.scale || 1})">${PROPS[layer.id](layer.params || {})}</g>`;
    } else if (layer.type === 'icons') {
      s += iconCards(layer.items, layer.area);
    } else if (layer.type === 'adult') {
      const k = layer.scale || 1.15;
      s += `<g data-layer="adult" transform="translate(${layer.at[0]} ${layer.at[1]}) scale(${layer.flip ? -k : k} ${k})">${renderCharacter(castMember(manifest, layer.who, c), { kind: 'adult', pose: layer.pose, mask: layer.mask, gloves: layer.gloves, look: layer.look ?? -0.2 })}</g>`;
    }
  }
  if (fgFile) s += `<image href="${esc(fgFile.url)}" x="${(-bleed).toFixed(2)}" y="${(-bleed).toFixed(2)}" width="${(1000 + 2 * bleed).toFixed(2)}" height="${(1000 + 2 * bleed).toFixed(2)}" preserveAspectRatio="xMidYMid slice"/>`;
  return { svg: s + '</svg>', placeholder };
}

/** HTML for one page: art plus live, selectable text. */
export function pageHTML(p, opts = {}) {
  const cls = `nub-page nub-style-${p.style} nub-set-${opts.textSetting || 'std'}`;
  let h = `<div class="${cls}" data-page-id="${esc(p.id)}">${p.art}<div class="nub-copy">`;
  if (p.title) h += `<p class="nub-title">${esc(p.title)}</p>`;
  if (p.body) h += `<p class="nub-body">${esc(p.body)}</p>`;
  h += '</div>';
  if (p.style === 'cover' || p.style === 'back') h += '<span class="nub-brand">Next Up Books</span>';
  if (p.folio) h += `<span class="nub-folio" aria-hidden="true">${p.folio}</span>`;
  if (p.placeholder && opts.placeholderLabel !== false) h += '<span class="nub-ph">Placeholder art</span>';
  return h + '</div>';
}

/**
 * Resolve a whole book from a design. Returns the frozen content model:
 * { titleId, storyVersion, …, cover: { front, back }, pages: [...] }.
 */
export function resolveBook(input) {
  const manifest = TITLES[input.titleId];
  const c = normalizeCharacter(input.character);
  const setting = input.textSetting || 'std';
  const one = (page, folio) => {
    const text = resolveText(page, c, setting);
    const alt = fillTokens(page.alt || '', c);
    const art = renderArt(manifest, page, c, alt);
    return { id: page.id, style: page.style || 'panel', folio, title: text.title, body: text.body, alt, art: art.svg, placeholder: art.placeholder };
  };
  return {
    titleId: manifest.id,
    title: manifest.title,
    storyVersion: manifest.storyVersion,
    artRevision: ART_REVISION,
    assetsDigest: ASSETS.digest,
    characterRevision: CHARACTER_REVISION,
    textSetting: setting,
    character: c,
    cover: { front: one(manifest.cover.front, null), back: one(manifest.cover.back, null) },
    pages: manifest.pages.map((p, i) => one(p, i + 1)),
  };
}

/**
 * Canonical string for a design. Both the browser and the server hash this
 * (SHA-256); a mismatch means the caregiver previewed something different
 * from what the server would freeze, and the reservation is refused.
 */
export function fingerprintSource(book, variantId) {
  const text = (p) => [p.id, p.title || '', p.body || ''];
  return JSON.stringify({
    t: book.titleId, sv: book.storyVersion, ar: book.artRevision, ad: book.assetsDigest, cr: book.characterRevision,
    v: String(variantId), ts: book.textSetting, c: book.character,
    cover: [text(book.cover.front), text(book.cover.back)],
    pages: book.pages.map(text),
  });
}

/** Continuity check used by tests: every selected support is drawn wherever the child appears. */
export function supportContinuity(book) {
  const expected = expectedSupportMarkers(book.character);
  const problems = [];
  for (const p of [book.cover.front, ...book.pages]) {
    const chunks = p.art.split('data-layer="child"').slice(1).map((x) => x.split('data-layer="adult"')[0]);
    for (const chunk of chunks) {
      for (const s of expected) if (!chunk.includes(`data-support="${s}"`)) problems.push(`${p.id}: ${s}`);
    }
  }
  return problems;
}
