// npm run check:content — reports which finished art files each title has,
// which are still placeholders, and any size or naming problems.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from './content.js';
import { POSES, WHEELCHAIR_POSE } from '../shared/character.js';
import { OPTIONS, CONFIG } from '../shared/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');
const c = loadContent(root);
const files = c.assets.files;
const PAGE_PX = Math.round((CONFIG.trimIn + 2 * CONFIG.bleedIn) * 300); // 2625
const problems = [...c.problems];
const known = new Set();

for (const t of c.titles.filter((x) => x.status !== 'fixture')) {
  const slots = [...t.pages.map((p) => p.id), 'cover-front', 'cover-back'];
  let have = 0;
  const missing = [];
  for (const id of slots) {
    const name = `nub-${t.code}-${id}-bg`;
    known.add(name); known.add(`nub-${t.code}-${id}-fg`); known.add(`nub-${t.code}-${id}-bg-wheelchair`);
    const f = files[name];
    if (!f) { missing.push(id); continue; }
    have++;
    if (f.w !== f.h) problems.push(`${f.rel}: must be square, is ${f.w}×${f.h}`);
    else if (f.w < PAGE_PX) problems.push(`${f.rel}: ${f.w}px is below ${PAGE_PX}px (8.75 in at 300 ppi incl. bleed)`);
  }
  known.add(`nub-${t.code}-card`);
  if (t.pages.length !== t.interiorPageCount) problems.push(`${t.handle}: interiorPageCount says ${t.interiorPageCount} but there are ${t.pages.length} pages`);
  if (t.pages.length < CONFIG.pageCountRange[0] || t.pages.length > CONFIG.pageCountRange[1]) problems.push(`${t.handle}: ${t.pages.length} pages is outside ${CONFIG.pageCountRange.join('–')}`);
  for (const p of t.pages) {
    if (!p.text?.std) problems.push(`${t.handle} ${p.id}: missing text.std`);
    if (!p.alt) problems.push(`${t.handle} ${p.id}: missing alt text`);
    if (/\{name\}/i.test(p.text?.std || '') && !p.text.noName && !/\{Name\}/.test(p.text.std)) problems.push(`${t.handle} ${p.id}: uses {name} but has no noName text`);
  }
  console.log(`${t.title}: ${have}/${slots.length} finished page plates${missing.length ? ` (placeholder: ${missing.join(' ')})` : ''}`);
}

// Character layers
const used = new Set();
for (const t of c.titles) for (const p of [...(t.pages || []), ...Object.values(t.cover || {})]) for (const l of p.layers || []) if (l.type === 'child') { used.add(l.pose); used.add(WHEELCHAIR_POSE[l.pose] || l.pose); }
const poses = Object.keys(POSES).filter((p) => used.has(p));
let charHave = 0;
let charNeed = 0;
for (const pose of poses) {
  const parts = [...OPTIONS.skin.map((o) => `body-${o.id}`), ...OPTIONS.outfit.map((o) => `outfit-${o.id}`), ...OPTIONS.hairStyle.flatMap((s) => OPTIONS.hairColor.map((col) => `hair-${s.id}-${col.id}`)), ...OPTIONS.eyes.filter((o) => o.id !== 'brown').map((o) => `eyes-${o.id}`), ...OPTIONS.supports.map((o) => `acc-${o.id}`), 'comfort-bunny', 'comfort-bear'];
  for (const part of parts) { charNeed++; const name = `nub-char-v1-${pose}-${part}`; known.add(name); if (files[name]) charHave++; }
}
console.log(`Character layers: ${charHave}/${charNeed} required files across ${poses.length} poses (missing layers fall back to placeholder drawings)`);
for (const [name, f] of Object.entries(files)) {
  if (name.startsWith('nub-char-v1-')) { if (f.w !== 1500 || f.h !== 2250) problems.push(`${f.rel}: character layers must be 1500×2250, is ${f.w}×${f.h}`); }
  else if (name.startsWith('nub-') && !known.has(name) && !name.startsWith('nub-fixture-') && !/-card$/.test(name)) problems.push(`${f.rel}: name does not match any page or layer — check the spelling`);
}
console.log(problems.length ? `\n${problems.length} problem(s):\n - ${problems.join('\n - ')}` : '\nNo problems found.');
process.exitCode = problems.length ? 1 : 0;
