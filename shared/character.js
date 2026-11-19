// Next Up Books — layered character renderer (PLACEHOLDER ART).
//
// Draws a child (or a supporting adult) as an SVG group from independent
// appearance choices. The same function is used by the storefront preview and
// by the server-side proof, so what a caregiver approves is what is frozen.
//
// Coordinate contract: the group's origin (0,0) is the point between the
// feet on the ground. Y grows downward (SVG), so the figure extends into
// negative Y. A standing child at scale 1 is ~300 units tall.
//
// Production note: these procedural shapes stand in for commissioned,
// pose-specific gouache art. The option IDs, pose IDs and anchor contract are
// what carries over; the drawing code does not.

export const CHARACTER_REVISION = 'char-2026.11-proto1';

export const SKIN = {
  s1: '#f6d7bd', s2: '#eebf98', s3: '#d9a070', s4: '#b97a4b', s5: '#8c5a36', s6: '#5e3b25',
};
export const HAIR_COLOR = {
  black: '#2b2320', darkbrown: '#4a2f24', brown: '#7a4a2e', lightbrown: '#9c6b3f', red: '#b5532a', blonde: '#d9a94e',
};
export const EYES = {
  brown: '#4a2f1f', hazel: '#7a5a2a', green: '#4f7a4a', blue: '#4a7fa3', gray: '#6f7b85',
};
export const OUTFITS = {
  cardigan: { top: '#c4572e', under: '#f4ead2', bottom: '#3f7f7c', shoes: '#f1e7d0', sleeve: 'long', detail: 'cardigan' },
  collar: { top: '#5f86b3', bottom: '#d9a02b', shoes: '#7a4a2e', sleeve: 'long', detail: 'collar' },
  leaf: { top: '#6f8f3e', bottom: '#64823a', shoes: '#5c7a3a', sleeve: 'long', detail: 'leaf' },
  flower: { top: '#b89acb', bottom: '#6f8fb3', shoes: '#e3b534', sleeve: 'short', detail: 'flower' },
  pocket: { top: '#e3b534', bottom: '#4f6f9c', shoes: '#f1e7d0', sleeve: 'short', detail: 'pocket' },
  // Supporting adults only (not offered in the editor).
  coat: { top: '#fbf8f0', under: '#4f8f8a', bottom: '#4f8f8a', shoes: '#f1e7d0', sleeve: 'long', detail: 'cardigan' },
  scrubs: { top: '#6fa3a0', bottom: '#5b8f8c', shoes: '#f1e7d0', sleeve: 'short', detail: 'vneck' },
  apron: { top: '#f1e4c8', bottom: '#55606b', shoes: '#3a3a3a', sleeve: 'long', detail: 'apron' },
  sweater: { top: '#efe2c4', bottom: '#7d8794', shoes: '#7a4a2e', sleeve: 'long', detail: 'rib' },
  desk: { top: '#d98a6a', bottom: '#5a6b7a', shoes: '#3a3a3a', sleeve: 'long', detail: 'collar' },
};

const BODY = {
  child: { headR: 52, torsoTop: -190, torsoBot: -96, torsoW: 78, legLen: 92, legW: 34, armLen: 82, armW: 24, hand: 12 },
  adult: { headR: 45, torsoTop: -318, torsoBot: -178, torsoW: 98, legLen: 176, legW: 40, armLen: 128, armW: 27, hand: 13 },
};
// Age band → silhouette tweak (scale applied by the scene, head ratio here).
export const AGE_BANDS = {
  '4-5': { scale: 0.9, headR: 54 },
  '6-7': { scale: 1.0, headR: 52 },
  '8-9': { scale: 1.1, headR: 49 },
};

// Pose contract. Arm angles are [upper, forearm] in degrees: 0 = straight
// down, 90 = straight out to the side, 180 = straight up. L is the viewer's
// left arm, R the viewer's right.
export const POSES = {
  stand: { seated: false, L: [8, 2], R: [8, 2] },
  wave: { seated: false, L: [8, 2], R: [118, 172] },
  handUp: { seated: false, L: [8, 2], R: [150, 180], palm: true },
  point: { seated: false, L: [8, 2], R: [78, 88] },
  holdHand: { seated: false, L: [38, 52], R: [8, 2] },
  sit: { seated: true, L: [16, -48], R: [16, -48] },
  sitWave: { seated: true, L: [16, -48], R: [118, 172] },
  sitHandUp: { seated: true, L: [16, -48], R: [150, 180], palm: true },
  sitPoint: { seated: true, L: [16, -48], R: [78, 88] },
};
// A child using a wheelchair is drawn seated on every page. This is the
// "associated seated pose" for each standing pose.
export const WHEELCHAIR_POSE = {
  stand: 'sit', wave: 'sitWave', handUp: 'sitHandUp', point: 'sitPoint', holdHand: 'sit',
  sit: 'sit', sitWave: 'sitWave', sitHandUp: 'sitHandUp', sitPoint: 'sitPoint',
};

const INK = '#2e2a26';
const n = (v) => Math.round(v * 10) / 10;
const rad = Math.PI / 180;

function shade(hex, amt) {
  const v = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((v >> s) & 255) * (1 + amt))));
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('');
}

function cap(R, fy, straight) {
  const y0 = -R * 0.02;
  const x = R * 1.04;
  const fringe = straight
    ? `L ${n(R * 0.8)} ${n(fy)} L ${n(-R * 0.8)} ${n(fy)}`
    : `Q ${n(R * 0.55)} ${n(fy)} 0 ${n(fy)} Q ${n(-R * 0.55)} ${n(fy)} ${n(-x)} ${n(y0)}`;
  return `<path d="M ${n(-x)} ${n(y0)} A ${n(x)} ${n(R * 1.06)} 0 0 1 ${n(x)} ${n(y0)} ${fringe} Z"/>`;
}

function hair(style, R, color) {
  const dark = shade(color, -0.18);
  let back = '';
  let front = '';
  if (style === 'curls') {
    back = `<circle cx="0" cy="${n(-R * 0.14)}" r="${n(R * 1.14)}"/>`;
    front = cap(R, -R * 0.52);
    for (let a = 192; a <= 348; a += 19.5) {
      front += `<circle cx="${n(Math.cos(a * rad) * R)}" cy="${n(Math.sin(a * rad) * R - R * 0.05)}" r="${n(R * 0.3)}"/>`;
    }
    for (let a = 215; a <= 325; a += 27.5) {
      front += `<circle cx="${n(Math.cos(a * rad) * R * 0.66)}" cy="${n(Math.sin(a * rad) * R * 0.66 - R * 0.3)}" r="${n(R * 0.25)}" fill="${dark}" opacity=".45"/>`;
    }
  } else if (style === 'bob') {
    back = `<rect x="${n(-R * 1.16)}" y="${n(-R * 1.0)}" width="${n(R * 2.32)}" height="${n(R * 1.98)}" rx="${n(R * 0.55)}"/>`;
    front = cap(R, -R * 0.34, true);
  } else if (style === 'puffs') {
    front = cap(R, -R * 0.6);
    for (const s of [-1, 1]) {
      const cx = s * R * 0.95;
      const cy = -R * 0.98;
      front += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.36)}"/>`;
      for (let a = 0; a < 360; a += 60) {
        front += `<circle cx="${n(cx + Math.cos(a * rad) * R * 0.32)}" cy="${n(cy + Math.sin(a * rad) * R * 0.32)}" r="${n(R * 0.19)}"/>`;
      }
    }
  } else if (style === 'wavy') {
    const w = R * 1.26;
    back = `<path d="M ${n(-w)} ${n(-R * 0.3)} A ${n(w)} ${n(R * 1.05)} 0 0 1 ${n(w)} ${n(-R * 0.3)} L ${n(w)} ${n(R * 1.1)} q ${n(-w / 3)} ${n(R * 0.35)} ${n(-w * 2 / 3)} 0 q ${n(-w / 3)} ${n(R * 0.35)} ${n(-w * 2 / 3)} 0 q ${n(-w / 3)} ${n(R * 0.35)} ${n(-w * 2 / 3)} 0 Z"/>`;
    front = `<path d="M ${n(-R * 1.04)} 0 A ${n(R * 1.04)} ${n(R * 1.06)} 0 0 1 ${n(R * 1.04)} 0 Q ${n(R * 0.9)} ${n(-R * 0.6)} ${n(-R * 0.2)} ${n(-R * 0.62)} Q ${n(-R * 0.8)} ${n(-R * 0.55)} ${n(-R * 1.04)} 0 Z"/>`;
  } else if (style === 'short') {
    front = cap(R, -R * 0.5);
    for (let i = -2; i <= 2; i++) {
      const x = i * R * 0.26;
      front += `<path d="M ${n(x - R * 0.16)} ${n(-R * 0.62)} L ${n(x + R * 0.04)} ${n(-R * 0.3)} L ${n(x + R * 0.2)} ${n(-R * 0.62)} Z"/>`;
    }
  } else if (style === 'crop') {
    front = cap(R, -R * 0.7);
  } else if (style === 'braids') {
    front = cap(R, -R * 0.52);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        front += `<ellipse cx="${n(s * R * 1.02)}" cy="${n(R * 0.3 + i * R * 0.3)}" rx="${n(R * 0.18)}" ry="${n(R * 0.2)}" fill="${i % 2 ? dark : color}"/>`;
      }
      front += `<circle cx="${n(s * R * 1.02)}" cy="${n(R * 1.72)}" r="${n(R * 0.11)}" fill="#e07a5f"/>`;
    }
  }
  return {
    back: back ? `<g fill="${dark}">${back}</g>` : '',
    front: front ? `<g fill="${color}">${front}</g>` : '',
  };
}

function face(R, c, o) {
  const eye = EYES[c.eyes] || EYES.brown;
  const look = o.look ?? 0.25;
  let s = '';
  for (const sd of [-1, 1]) {
    const ex = sd * R * 0.37;
    const ey = R * 0.06;
    s += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="${n(R * 0.16)}" ry="${n(R * 0.19)}" fill="#fffaf0"/>`;
    s += `<circle cx="${n(ex + look * R * 0.12)}" cy="${n(ey + R * 0.02)}" r="${n(R * 0.125)}" fill="${eye}"/>`;
    s += `<circle cx="${n(ex + look * R * 0.12)}" cy="${n(ey + R * 0.02)}" r="${n(R * 0.07)}" fill="${INK}"/>`;
    s += `<circle cx="${n(ex + look * R * 0.12 + R * 0.04)}" cy="${n(ey - R * 0.04)}" r="${n(R * 0.03)}" fill="#fff"/>`;
    s += `<path d="M ${n(ex - R * 0.17)} ${n(ey - R * 0.3)} q ${n(R * 0.17)} ${n(-R * 0.08)} ${n(R * 0.34)} 0" stroke="${shade(c._hair, -0.2)}" stroke-width="${n(R * 0.06)}" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="${n(sd * R * 0.58)}" cy="${n(R * 0.42)}" r="${n(R * 0.17)}" fill="#e07a5f" opacity=".32"/>`;
  }
  s += `<path d="M ${n(-R * 0.06)} ${n(R * 0.3)} q ${n(R * 0.06)} ${n(R * 0.07)} ${n(R * 0.12)} 0" stroke="${shade(c._skin, -0.28)}" stroke-width="${n(R * 0.05)}" fill="none" stroke-linecap="round"/>`;
  if (o.mask) {
    s += `<path d="M ${n(-R * 0.6)} ${n(R * 0.3)} Q 0 ${n(R * 0.18)} ${n(R * 0.6)} ${n(R * 0.3)} L ${n(R * 0.5)} ${n(R * 0.8)} Q 0 ${n(R * 1.0)} ${n(-R * 0.5)} ${n(R * 0.8)} Z" fill="#cfe3ea" stroke="#9dbfca" stroke-width="2"/>`;
  } else if (o.mouth === 'open') {
    s += `<ellipse cx="0" cy="${n(R * 0.58)}" rx="${n(R * 0.2)}" ry="${n(R * 0.17)}" fill="#7a2f2a"/><ellipse cx="0" cy="${n(R * 0.5)}" rx="${n(R * 0.14)}" ry="${n(R * 0.045)}" fill="#fff"/>`;
  } else {
    s += `<path d="M ${n(-R * 0.22)} ${n(R * 0.5)} Q 0 ${n(R * 0.72)} ${n(R * 0.22)} ${n(R * 0.5)}" stroke="${INK}" stroke-width="${n(R * 0.055)}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

function aacDevice(x, y, w) {
  const h = w * 0.8;
  const cols = ['#e07a5f', '#6fa3c8', '#e3b534', '#6f8f3e', '#b89acb', '#d9a02b', '#4f8f8a', '#e07a5f', '#e3b534'];
  let s = `<g data-support="aac"><rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(w * 0.14)}" fill="#3f6f78"/>`;
  s += `<rect x="${n(x - w * 0.4)}" y="${n(y - h * 0.38)}" width="${n(w * 0.8)}" height="${n(h * 0.76)}" rx="3" fill="#fbf4e2"/>`;
  const cw = (w * 0.8) / 3;
  const chh = (h * 0.76) / 3;
  cols.forEach((col, i) => {
    s += `<rect x="${n(x - w * 0.4 + (i % 3) * cw + 2)}" y="${n(y - h * 0.38 + Math.floor(i / 3) * chh + 2)}" width="${n(cw - 4)}" height="${n(chh - 4)}" rx="2" fill="${col}"/>`;
  });
  return s + '</g>';
}

function softToy(kind, x, y, k) {
  const col = kind === 'bear' ? '#a8754a' : '#9fb07a';
  const inner = kind === 'bear' ? '#d9b48a' : '#c9d4a8';
  let s = `<g data-support="comfort" transform="translate(${n(x)} ${n(y)}) scale(${k})">`;
  if (kind === 'bear') {
    s += `<circle cx="-11" cy="-37" r="7" fill="${col}"/><circle cx="11" cy="-37" r="7" fill="${col}"/>`;
  } else {
    s += `<ellipse cx="-8" cy="-46" rx="6" ry="17" fill="${col}" transform="rotate(-12 -8 -46)"/><ellipse cx="8" cy="-46" rx="6" ry="17" fill="${col}" transform="rotate(14 8 -46)"/>`;
  }
  s += `<ellipse cx="0" cy="-6" rx="15" ry="17" fill="${col}"/><ellipse cx="0" cy="-3" rx="8" ry="10" fill="${inner}"/>`;
  s += `<circle cx="0" cy="-27" r="14" fill="${col}"/><circle cx="-5" cy="-29" r="1.8" fill="${INK}"/><circle cx="5" cy="-29" r="1.8" fill="${INK}"/><ellipse cx="0" cy="-23" rx="3" ry="2" fill="#7a4a2e"/>`;
  s += `<ellipse cx="-14" cy="-8" rx="5" ry="8" fill="${col}"/><ellipse cx="14" cy="-8" rx="5" ry="8" fill="${col}"/>`;
  return s + '</g>';
}

function wheelchair(b, hipY) {
  const wx = b.torsoW / 2 + 28;
  let s = '<g data-support="wheelchair">';
  s += `<rect x="${n(-b.torsoW / 2 - 10)}" y="${n(hipY - 92)}" width="${n(b.torsoW + 20)}" height="${n(96)}" rx="12" fill="#7a5a8a"/>`;
  s += `<rect x="${n(-b.torsoW / 2 - 20)}" y="${n(hipY - 100)}" width="14" height="22" rx="6" fill="#3a3a3a"/><rect x="${n(b.torsoW / 2 + 6)}" y="${n(hipY - 100)}" width="14" height="22" rx="6" fill="#3a3a3a"/>`;
  for (const sd of [-1, 1]) {
    s += `<ellipse cx="${n(sd * wx)}" cy="-66" rx="17" ry="66" fill="#4a4a4a"/><ellipse cx="${n(sd * wx)}" cy="-66" rx="9" ry="56" fill="#c9c4bb"/><ellipse cx="${n(sd * wx)}" cy="-66" rx="4" ry="10" fill="#4a4a4a"/>`;
    s += `<path d="M ${n(sd * (b.torsoW / 2 + 4))} ${n(hipY + 6)} L ${n(sd * 30)} -8" stroke="#55606b" stroke-width="7" stroke-linecap="round"/>`;
    s += `<ellipse cx="${n(sd * 40)}" cy="-10" rx="7" ry="11" fill="#3a3a3a"/>`;
  }
  s += `<rect x="${n(-b.torsoW / 2 - 12)}" y="${n(hipY - 2)}" width="${n(b.torsoW + 24)}" height="16" rx="7" fill="#5f4670"/>`;
  s += `<rect x="-36" y="-9" width="72" height="11" rx="5" fill="#3a3a3a"/>`;
  return s + '</g>';
}

function torso(b, o, dy) {
  const w = b.torsoW;
  const top = b.torsoTop + dy;
  const h = b.torsoBot - b.torsoTop + 6;
  const x = -w / 2;
  let s = '';
  const base = o.detail === 'cardigan' ? o.under : o.top;
  s += `<rect x="${n(x)}" y="${n(top)}" width="${n(w)}" height="${n(h)}" rx="20" fill="${base}"/>`;
  if (o.detail === 'cardigan') {
    if (o.under === '#f4ead2') {
      for (let i = 1; i <= 4; i++) s += `<rect x="${n(-w * 0.2)}" y="${n(top + i * h * 0.19)}" width="${n(w * 0.4)}" height="5" fill="#3f7f7c" opacity=".8"/>`;
    }
    s += `<path d="M ${n(x)} ${n(top + 20)} Q ${n(x)} ${n(top)} ${n(x + 20)} ${n(top)} L ${n(-w * 0.1)} ${n(top)} L ${n(-w * 0.17)} ${n(top + h)} L ${n(x + 16)} ${n(top + h)} Q ${n(x)} ${n(top + h)} ${n(x)} ${n(top + h - 16)} Z" fill="${o.top}"/>`;
    s += `<path d="M ${n(-x)} ${n(top + 20)} Q ${n(-x)} ${n(top)} ${n(-x - 20)} ${n(top)} L ${n(w * 0.1)} ${n(top)} L ${n(w * 0.17)} ${n(top + h)} L ${n(-x - 16)} ${n(top + h)} Q ${n(-x)} ${n(top + h)} ${n(-x)} ${n(top + h - 16)} Z" fill="${o.top}"/>`;
    for (let i = 0; i < 3; i++) s += `<circle cx="${n(w * 0.22)}" cy="${n(top + h * (0.35 + i * 0.22))}" r="3.5" fill="${shade(o.top, -0.25)}"/>`;
  } else if (o.detail === 'collar') {
    s += `<path d="M -22 ${n(top + 2)} q 10 18 22 4 q 12 14 22 -4 Z" fill="${shade(o.top, 0.35)}"/>`;
  } else if (o.detail === 'leaf') {
    s += `<path d="M 0 ${n(top + h * 0.3)} q 18 12 0 ${n(h * 0.42)} q -18 -${n(h * 0.3)} 0 -${n(h * 0.42)} Z" fill="#b9cc7a"/>`;
  } else if (o.detail === 'flower') {
    const cy = top + h * 0.5;
    for (let a = 0; a < 360; a += 72) s += `<circle cx="${n(Math.cos(a * rad) * 10)}" cy="${n(cy + Math.sin(a * rad) * 10)}" r="7" fill="#fbf4e2"/>`;
    s += `<circle cx="0" cy="${n(cy)}" r="5" fill="#e3b534"/>`;
  } else if (o.detail === 'pocket') {
    s += `<rect x="${n(w * 0.08)}" y="${n(top + h * 0.28)}" width="20" height="20" rx="4" fill="${shade(o.top, -0.14)}"/>`;
  } else if (o.detail === 'vneck') {
    s += `<path d="M -14 ${n(top)} L 0 ${n(top + 24)} L 14 ${n(top)} Z" fill="${shade(o.top, -0.2)}"/>`;
  } else if (o.detail === 'rib') {
    s += `<rect x="-20" y="${n(top - 2)}" width="40" height="12" rx="6" fill="${shade(o.top, -0.1)}"/>`;
  } else if (o.detail === 'apron') {
    s += `<path d="M -18 ${n(top + 4)} L ${n(-w * 0.3)} ${n(top + h * 0.3)} L ${n(-w * 0.42)} ${n(top + h + 40)} L ${n(w * 0.42)} ${n(top + h + 40)} L ${n(w * 0.3)} ${n(top + h * 0.3)} L 18 ${n(top + 4)} L 12 ${n(top + 4)} L 12 ${n(top + h * 0.28)} L -12 ${n(top + h * 0.28)} L -12 ${n(top + 4)} Z" fill="#4a535c"/>`;
    s += `<rect x="-16" y="${n(top + h * 0.5)}" width="32" height="24" rx="4" fill="#3d454d"/>`;
  }
  return s;
}

function arm(b, side, ang, o, skin, handCol, dy, palm) {
  const sx = side * (b.torsoW / 2 - 7);
  const sy = b.torsoTop + 17 + dy;
  const l = b.armLen / 2;
  const ex = sx + side * Math.sin(ang[0] * rad) * l;
  const ey = sy + Math.cos(ang[0] * rad) * l;
  const hx = ex + side * Math.sin(ang[1] * rad) * l;
  const hy = ey + Math.cos(ang[1] * rad) * l;
  const sw = b.armW;
  let s = '';
  const line = (x1, y1, x2, y2, x3, y3, col) =>
    `<path d="M ${n(x1)} ${n(y1)} L ${n(x2)} ${n(y2)}${x3 == null ? '' : ` L ${n(x3)} ${n(y3)}`}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  if (o.sleeve === 'short') {
    s += line(sx, sy, ex, ey, hx, hy, skin);
    s += line(sx, sy, sx + (ex - sx) * 0.62, sy + (ey - sy) * 0.62, null, null, o.top);
  } else {
    s += line(sx, sy, ex, ey, hx, hy, o.top);
  }
  if (palm) {
    for (let i = -1.5; i <= 1.5; i++) s += `<rect x="${n(hx + i * 7 - 3)}" y="${n(hy - b.hand - 15)}" width="6" height="18" rx="3" fill="${handCol}"/>`;
    s += `<circle cx="${n(hx)}" cy="${n(hy - 3)}" r="${b.hand + 3}" fill="${handCol}"/>`;
  } else {
    s += `<circle cx="${n(hx)}" cy="${n(hy)}" r="${b.hand}" fill="${handCol}"/>`;
  }
  return { svg: s, hand: [hx, hy] };
}

/**
 * Render a figure.
 * @param {object} c    character choices (skin, hairStyle, hairColor, eyes, outfit, supports[], mobility, comfort, ageBand)
 * @param {object} opt  { pose, wear: 'bib'|'cape'|null, mouth: 'open'|null, look: -1..1, kind: 'child'|'adult', mask, gloves }
 * @returns {string} SVG markup, origin at the feet
 */
export function renderCharacter(c, opt = {}) {
  const kind = opt.kind || 'child';
  const b = { ...BODY[kind] };
  if (kind === 'child') b.headR = (AGE_BANDS[c.ageBand] || AGE_BANDS['6-7']).headR;
  const supports = new Set(c.supports || []);
  const inChair = c.mobility === 'wheelchair';
  let poseId = opt.pose || 'stand';
  if (inChair) poseId = WHEELCHAIR_POSE[poseId] || 'sit';
  const pose = POSES[poseId] || POSES.stand;
  const o = OUTFITS[c.outfit] || OUTFITS.cardigan;
  const skin = SKIN[c.skin] || SKIN.s3;
  const hairCol = HAIR_COLOR[c.hairColor] || HAIR_COLOR.darkbrown;
  const handCol = opt.gloves ? '#b9a3d6' : skin;
  const cc = { ...c, _skin: skin, _hair: hairCol };
  const dy = pose.seated ? b.legLen * 0.48 : 0;
  const hipY = b.torsoBot + dy;
  const cape = opt.wear === 'cape';
  let s = `<g data-figure="${kind}" data-pose="${poseId}">`;

  s += `<ellipse cx="0" cy="2" rx="${n(b.torsoW * (inChair ? 1.15 : 0.75))}" ry="9" fill="#2e2a26" opacity=".12"/>`;
  if (inChair) s += wheelchair(b, hipY);

  // Legs and shoes
  const lx = b.torsoW / 4 + 1;
  if (pose.seated) {
    for (const sd of [-1, 1]) s += `<rect x="${n(sd * lx - b.legW / 2)}" y="${n(hipY - 6)}" width="${b.legW}" height="${n(-hipY - 6)}" rx="10" fill="${shade(o.bottom, -0.1)}"/>`;
    s += `<rect x="${n(-b.torsoW / 2 - 5)}" y="${n(hipY - 24)}" width="${n(b.torsoW + 10)}" height="36" rx="16" fill="${o.bottom}"/>`;
  } else {
    for (const sd of [-1, 1]) s += `<rect x="${n(sd * lx - b.legW / 2)}" y="${n(b.torsoBot - 8)}" width="${b.legW}" height="${n(-b.torsoBot - 2)}" rx="10" fill="${o.bottom}"/>`;
  }
  for (const sd of [-1, 1]) s += `<ellipse cx="${n(sd * (lx + 3))}" cy="-7" rx="${n(b.legW * 0.66)}" ry="10" fill="${o.shoes}" stroke="${shade(o.shoes, -0.25)}" stroke-width="2"/>`;

  // Arms behind torso when resting, in front when raised
  const L = cape ? null : arm(b, -1, pose.L, o, skin, handCol, dy, false);
  const R = cape ? null : arm(b, 1, pose.R, o, skin, handCol, dy, pose.palm);
  const { back, front } = hair(c.hairStyle, b.headR, hairCol);
  const hy = b.torsoTop - b.headR * 0.8 + dy;

  s += `<g transform="translate(0 ${n(hy)})">${back}</g>`;
  s += `<rect x="-12" y="${n(b.torsoTop - 12 + dy)}" width="24" height="24" rx="8" fill="${shade(skin, -0.08)}"/>`;
  s += torso(b, o, dy);
  if (!cape) s += L.svg + R.svg;
  if (opt.wear === 'bib') {
    s += `<path d="M -26 ${n(b.torsoTop + dy + 2)} L 26 ${n(b.torsoTop + dy + 2)} L 30 ${n(b.torsoTop + dy + 62)} Q 0 ${n(b.torsoTop + dy + 76)} -30 ${n(b.torsoTop + dy + 62)} Z" fill="#fdfbf4" stroke="#d9d2c0" stroke-width="2"/>`;
  }
  if (cape) {
    const t = b.torsoTop + dy - 4;
    const wb = b.torsoW / 2 + 52;
    s += `<path d="M -18 ${n(t)} L 18 ${n(t)} Q ${n(wb)} ${n(t + 50)} ${n(wb)} ${n(hipY + 26)} Q 0 ${n(hipY + 50)} ${n(-wb)} ${n(hipY + 26)} Q ${n(-wb)} ${n(t + 50)} -18 ${n(t)} Z" fill="#3f6f78"/>`;
    s += `<path d="M -22 ${n(t - 2)} Q 0 ${n(t + 16)} 22 ${n(t - 2)} L 18 ${n(t + 10)} Q 0 ${n(t + 24)} -18 ${n(t + 10)} Z" fill="#2f5560"/>`;
    s += `<path d="M ${n(-wb * 0.5)} ${n(t + 60)} Q ${n(-wb * 0.56)} ${n(hipY)} ${n(-wb * 0.6)} ${n(hipY + 30)}" stroke="#2f5560" stroke-width="3" fill="none" opacity=".5"/><path d="M ${n(wb * 0.5)} ${n(t + 60)} Q ${n(wb * 0.56)} ${n(hipY)} ${n(wb * 0.6)} ${n(hipY + 30)}" stroke="#2f5560" stroke-width="3" fill="none" opacity=".5"/>`;
  }

  // Head
  const R0 = b.headR;
  s += `<g transform="translate(0 ${n(hy)})">`;
  for (const sd of [-1, 1]) s += `<circle cx="${n(sd * R0 * 0.97)}" cy="${n(R0 * 0.12)}" r="${n(R0 * 0.17)}" fill="${skin}"/><circle cx="${n(sd * R0 * 0.97)}" cy="${n(R0 * 0.12)}" r="${n(R0 * 0.08)}" fill="${shade(skin, -0.14)}"/>`;
  s += `<ellipse cx="0" cy="0" rx="${R0}" ry="${n(R0 * 0.96)}" fill="${skin}"/>`;
  s += face(R0, cc, opt);
  s += front;
  if (supports.has('glasses')) {
    s += `<g data-support="glasses" fill="none" stroke="#2f7f86" stroke-width="${n(R0 * 0.07)}"><circle cx="${n(-R0 * 0.37)}" cy="${n(R0 * 0.07)}" r="${n(R0 * 0.27)}"/><circle cx="${n(R0 * 0.37)}" cy="${n(R0 * 0.07)}" r="${n(R0 * 0.27)}"/><path d="M ${n(-R0 * 0.1)} ${n(R0 * 0.04)} L ${n(R0 * 0.1)} ${n(R0 * 0.04)} M ${n(-R0 * 0.64)} ${n(R0 * 0.04)} L ${n(-R0 * 0.95)} ${n(R0 * 0.02)} M ${n(R0 * 0.64)} ${n(R0 * 0.04)} L ${n(R0 * 0.95)} ${n(R0 * 0.02)}"/></g>`;
  }
  if (supports.has('hearingAids')) {
    s += '<g data-support="hearingAids">';
    for (const sd of [-1, 1]) {
      s += `<path d="M ${n(sd * R0 * 1.04)} ${n(-R0 * 0.02)} q ${n(sd * R0 * 0.02)} ${n(R0 * 0.12)} ${n(-sd * R0 * 0.06)} ${n(R0 * 0.18)}" stroke="#fdfbf4" stroke-width="3" fill="none"/>`;
      s += `<ellipse cx="${n(sd * R0 * 1.1)}" cy="${n(-R0 * 0.08)}" rx="${n(R0 * 0.09)}" ry="${n(R0 * 0.2)}" fill="#e3cfa8" stroke="#8c7a55" stroke-width="2" transform="rotate(${sd * 12} ${n(sd * R0 * 1.1)} ${n(-R0 * 0.08)})"/>`;
    }
    s += '</g>';
  }
  if (supports.has('earDefenders')) {
    s += `<g data-support="earDefenders"><path d="M ${n(-R0 * 1.08)} ${n(R0 * 0.05)} A ${n(R0 * 1.1)} ${n(R0 * 1.16)} 0 0 1 ${n(R0 * 1.08)} ${n(R0 * 0.05)}" stroke="#8b5a8c" stroke-width="${n(R0 * 0.17)}" fill="none" stroke-linecap="round"/>`;
    for (const sd of [-1, 1]) s += `<ellipse cx="${n(sd * R0 * 1.06)}" cy="${n(R0 * 0.14)}" rx="${n(R0 * 0.27)}" ry="${n(R0 * 0.4)}" fill="#8b5a8c"/><ellipse cx="${n(sd * R0 * 1.1)}" cy="${n(R0 * 0.14)}" rx="${n(R0 * 0.14)}" ry="${n(R0 * 0.28)}" fill="#a77aa8"/>`;
    s += '</g>';
  }
  s += '</g>';

  // Carried supports. Seated (and caped) poses rest them on the lap so they
  // stay visible on every page.
  const toy = c.comfort && c.comfort !== 'none' ? c.comfort : null;
  if (pose.seated) {
    if (toy) s += softToy(toy, -b.torsoW * 0.3, hipY - 14, 0.95);
    if (supports.has('aac')) s += aacDevice(b.torsoW * 0.3, hipY - 26, 48);
  } else {
    if (toy) s += softToy(toy, L.hand[0] - 6, L.hand[1] + 30, 0.95);
    if (supports.has('aac')) {
      const ax = b.torsoW / 2 + 22;
      const ay = b.torsoBot - 4;
      s += `<path d="M ${n(-b.torsoW / 2 + 12)} ${n(b.torsoTop + 6)} L ${n(ax)} ${n(ay - 18)}" stroke="#3f6f78" stroke-width="5" stroke-linecap="round"/>`;
      s += aacDevice(ax, ay, 46);
    }
  }
  return s + '</g>';
}

/** The pose actually drawn for a character (wheelchair users are always seated). */
export function resolvePose(c, pose) {
  const id = c.mobility === 'wheelchair' ? WHEELCHAIR_POSE[pose] || 'sit' : pose || 'stand';
  return POSES[id] ? id : 'stand';
}

/** Supports that must be visible whenever the child appears on a page. */
export function expectedSupportMarkers(c) {
  const out = [...(c.supports || [])];
  if (c.mobility === 'wheelchair') out.push('wheelchair');
  if (c.comfort && c.comfort !== 'none') out.push('comfort');
  return out;
}
