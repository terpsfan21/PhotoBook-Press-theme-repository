// Loads the content/ folder: catalog, title manifests, and an index of every
// art file found (matched to pages purely by file name).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const IMG = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4']);

/** Pixel size of a PNG or JPEG without decoding it. */
export function imageSize(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(32);
    fs.readSync(fd, head, 0, 32, 0);
    if (head.readUInt32BE(0) === 0x89504e47) return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
    if (head[0] === 0xff && head[1] === 0xd8) {
      const buf = fs.readFileSync(file);
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } finally {
    fs.closeSync(fd);
  }
  return { w: 0, h: 0 };
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

export function loadContent(root) {
  const problems = [];
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
  const files = {};
  const sig = [];
  for (const f of walk(root).sort()) {
    const ext = path.extname(f).toLowerCase();
    if (!IMG.has(ext)) continue;
    const name = path.basename(f, path.extname(f));
    const rel = path.relative(root, f).split(path.sep).join('/');
    if (files[name]) problems.push(`Duplicate art file name "${name}" (${files[name].rel} and ${rel}). Names must be unique.`);
    const st = fs.statSync(f);
    files[name] = { url: `/content/${rel}`, rel, ...imageSize(f), bytes: st.size };
    sig.push(`${rel}:${st.size}:${Math.round(st.mtimeMs)}`);
  }
  const titles = [];
  const read = (dir) => {
    const file = path.join(root, dir, 'title.json');
    try {
      const t = JSON.parse(fs.readFileSync(file, 'utf8'));
      sig.push(`${dir}:${crypto.createHash('sha256').update(JSON.stringify(t)).digest('hex').slice(0, 16)}`);
      titles.push(t);
    } catch (err) {
      problems.push(`${dir}/title.json could not be read: ${err.message}`);
    }
  };
  for (const handle of catalog.titles) read(path.join('titles', handle));
  if (fs.existsSync(path.join(root, 'fixtures', 'title.json'))) read('fixtures');
  const digest = crypto.createHash('sha256').update(sig.join('|')).digest('hex').slice(0, 16);
  const concepts = (catalog.concepts || []).map((c) => ({ ...c, image: files[c.image.replace(/\.\w+$/, '')]?.url || null }));
  return { titles, concepts, partners: catalog.partners || {}, assets: { files, digest }, problems };
}
