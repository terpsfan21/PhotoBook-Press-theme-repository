// Next Up Books — background plates, props and icon cards (PLACEHOLDER ART).
//
// Every page is composed on a 1000 × 1000 unit square (the 8.5 × 8.5 in trim).
// Backgrounds fill the square. Props are drawn at an anchor point (their
// base-centre on the floor). Story text sits in a panel over the lower part
// of the page, so key art stays above y ≈ 740.

export const ART_REVISION = 'art-2026.11-placeholder1';

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const INK = '#2e2a26';

const wall = (c) => `<rect width="1000" height="1000" fill="${c}"/>`;
const floor = (c, y = 600, edge = '#00000018') => `<rect y="${y}" width="1000" height="${1000 - y}" fill="${c}"/><rect y="${y}" width="1000" height="10" fill="${edge}"/>`;

function plant(x, y, k = 1) {
  let s = `<g transform="translate(${x} ${y}) scale(${k})"><path d="M -26 -50 L 26 -50 L 20 0 L -20 0 Z" fill="#e6dcc6"/>`;
  [[-28, -86, -30], [0, -100, 0], [28, -86, 30], [-14, -70, -60], [16, -68, 60]].forEach(([lx, ly, r]) => {
    s += `<ellipse cx="${lx}" cy="${ly}" rx="14" ry="30" fill="#6f8f3e" transform="rotate(${r} ${lx} ${ly})"/>`;
  });
  return s + '</g>';
}
function tree(x, y, k = 1) {
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-12" y="-150" width="24" height="150" rx="8" fill="#8c5a36"/><circle cx="0" cy="-190" r="70" fill="#6f8f3e"/><circle cx="-52" cy="-150" r="46" fill="#7d9c48"/><circle cx="52" cy="-156" r="50" fill="#64823a"/><circle cx="14" cy="-230" r="40" fill="#8aa653"/></g>`;
}
function windowFrame(x, y, w, h) {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#3f7f7c"/><rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" fill="#dcebe6"/><circle cx="${x + w * 0.68}" cy="${y + h * 0.42}" r="${w * 0.2}" fill="#8aa653"/><circle cx="${x + w * 0.48}" cy="${y + h * 0.6}" r="${w * 0.17}" fill="#d9a02b" opacity=".8"/><rect x="${x + w / 2 - 6}" y="${y + 8}" width="12" height="${h - 16}" fill="#3f7f7c"/><rect x="${x + 8}" y="${y + h / 2 - 6}" width="${w - 16}" height="12" fill="#3f7f7c"/><rect x="${x - 10}" y="${y + h - 4}" width="${w + 20}" height="14" rx="5" fill="#2f6562"/></g>`;
}
function picture(x, y, iconId) {
  return `<g><rect x="${x}" y="${y}" width="150" height="150" rx="8" fill="#b97a45"/><rect x="${x + 12}" y="${y + 12}" width="126" height="126" fill="#fbf4e2"/><g transform="translate(${x + 25} ${y + 25})">${ICONS[iconId] || ''}</g></g>`;
}
function smallChair(x, y, col = '#4f8f8a') {
  return `<g transform="translate(${x} ${y})"><rect x="-58" y="-170" width="116" height="110" rx="18" fill="${col}"/><rect x="-66" y="-66" width="132" height="26" rx="10" fill="${col}"/><rect x="-66" y="-66" width="132" height="8" rx="4" fill="#ffffff22"/><rect x="-58" y="-44" width="12" height="44" fill="#b97a45"/><rect x="46" y="-44" width="12" height="44" fill="#b97a45"/></g>`;
}

// ---------------------------------------------------------------- icons
// Each icon is drawn in a 100 × 100 box.
export const ICONS = {
  tooth: `<path d="M 26 22 Q 38 12 50 20 Q 62 12 74 22 Q 86 36 76 58 Q 72 84 64 86 Q 58 84 56 66 Q 50 56 44 66 Q 42 84 36 86 Q 28 84 24 58 Q 14 36 26 22 Z" fill="#fffdf6" stroke="#9dbfca" stroke-width="4"/><circle cx="41" cy="42" r="3.5" fill="${INK}"/><circle cx="59" cy="42" r="3.5" fill="${INK}"/><path d="M 42 52 Q 50 60 58 52" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  toothbrush: `<rect x="14" y="60" width="62" height="12" rx="6" fill="#e07a5f" transform="rotate(-30 50 50)"/><rect x="62" y="38" width="30" height="12" rx="4" fill="#fbf4e2" stroke="#9dbfca" stroke-width="3" transform="rotate(-30 50 50)"/><rect x="64" y="28" width="26" height="12" rx="3" fill="#6fa3c8" transform="rotate(-30 50 50)"/>`,
  mirror: `<rect x="44" y="40" width="9" height="54" rx="4" fill="#9aa5ad" transform="rotate(28 50 50)"/><circle cx="62" cy="26" r="19" fill="#9aa5ad"/><circle cx="62" cy="26" r="14" fill="#dcebf0"/><path d="M 54 22 q 6 -8 14 -6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  counter: `<rect x="46" y="30" width="8" height="64" rx="4" fill="#9aa5ad" transform="rotate(28 50 50)"/><path d="M 66 22 q 12 -10 16 2" stroke="#9aa5ad" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  polisher: `<rect x="20" y="52" width="56" height="16" rx="8" fill="#6fa3c8" transform="rotate(-28 50 50)"/><rect x="72" y="50" width="12" height="20" rx="3" fill="#9aa5ad" transform="rotate(-28 50 50)"/><circle cx="84" cy="34" r="8" fill="#fbf4e2" stroke="#9aa5ad" stroke-width="3"/><path d="M 12 30 q 6 -6 12 0 M 10 44 q 6 -6 12 0" stroke="#d9a02b" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  waterSpray: `<rect x="14" y="56" width="50" height="14" rx="7" fill="#9aa5ad" transform="rotate(-24 50 50)"/><path d="M 74 30 q 6 10 0 14 q -6 -4 0 -14 Z M 86 44 q 5 8 0 12 q -5 -4 0 -12 Z M 82 18 q 4 7 0 10 q -4 -3 0 -10 Z" fill="#6fa3c8"/>`,
  straw: `<path d="M 20 86 L 58 30 Q 64 20 76 22 L 86 24" stroke="#b9d6dd" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M 20 86 L 58 30 Q 64 20 76 22 L 86 24" stroke="#fdfbf4" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/><path d="M 70 46 q 5 8 0 12 q -5 -4 0 -12 Z" fill="#6fa3c8"/>`,
  comb: `<rect x="12" y="34" width="76" height="16" rx="6" fill="#d9a02b"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${17 + i * 8}" y="48" width="4" height="24" rx="2" fill="#d9a02b"/>`).join('')}`,
  scissors: `<path d="M 30 16 L 58 62 M 70 16 L 42 62" stroke="#9aa5ad" stroke-width="8" stroke-linecap="round"/><circle cx="36" cy="76" r="12" fill="none" stroke="#e07a5f" stroke-width="7"/><circle cx="64" cy="76" r="12" fill="none" stroke="#e07a5f" stroke-width="7"/><circle cx="50" cy="48" r="3.5" fill="${INK}"/>`,
  clippers: `<rect x="34" y="30" width="32" height="60" rx="10" fill="#55606b"/><rect x="32" y="16" width="36" height="18" rx="3" fill="#c9c4bb"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${34 + i * 5.6}" y="8" width="3" height="10" fill="#9aa5ad"/>`).join('')}<rect x="45" y="48" width="10" height="20" rx="5" fill="#e3b534"/><path d="M 14 34 q 6 -6 12 0 M 14 48 q 6 -6 12 0 M 74 34 q 6 -6 12 0 M 74 48 q 6 -6 12 0" stroke="#d9a02b" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  sprayBottle: `<rect x="32" y="44" width="36" height="48" rx="8" fill="#6fa3a0"/><rect x="42" y="30" width="16" height="16" fill="#4f8f8a"/><path d="M 34 20 L 64 20 L 64 32 L 44 32 Z" fill="#e6dcc6"/><rect x="26" y="20" width="10" height="8" rx="2" fill="#e6dcc6"/><circle cx="14" cy="18" r="2.5" fill="#6fa3c8"/><circle cx="12" cy="28" r="2.5" fill="#6fa3c8"/><circle cx="6" cy="22" r="2.5" fill="#6fa3c8"/>`,
  softBrush: `<rect x="44" y="50" width="12" height="42" rx="6" fill="#b97a45"/><path d="M 30 52 Q 26 14 50 10 Q 74 14 70 52 Z" fill="#f1e4c8" stroke="#d9c9a3" stroke-width="3"/><path d="M 40 46 L 40 22 M 50 46 L 50 16 M 60 46 L 60 22" stroke="#d9c9a3" stroke-width="3" stroke-linecap="round"/>`,
  cape: `<path d="M 40 14 L 60 14 Q 92 40 90 84 Q 50 96 10 84 Q 8 40 40 14 Z" fill="#3f6f78"/><path d="M 38 13 Q 50 26 62 13 L 60 22 Q 50 32 40 22 Z" fill="#2f5560"/>`,
  handMirror: `<rect x="44" y="56" width="12" height="38" rx="6" fill="#d9a02b"/><circle cx="50" cy="36" r="28" fill="#d9a02b"/><circle cx="50" cy="36" r="21" fill="#dcebf0"/><path d="M 38 30 q 8 -12 20 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  hand: `<circle cx="50" cy="50" r="46" fill="#e07a5f"/><rect x="29" y="26" width="9" height="34" rx="4.5" fill="#fffaf0"/><rect x="40" y="18" width="9" height="40" rx="4.5" fill="#fffaf0"/><rect x="51" y="18" width="9" height="40" rx="4.5" fill="#fffaf0"/><rect x="62" y="26" width="9" height="34" rx="4.5" fill="#fffaf0"/><rect x="29" y="48" width="42" height="32" rx="14" fill="#fffaf0"/><rect x="18" y="52" width="16" height="9" rx="4.5" fill="#fffaf0" transform="rotate(35 26 56)"/>`,
  question: `<circle cx="50" cy="50" r="46" fill="#6fa3c8"/><path d="M 36 38 Q 36 22 50 22 Q 66 22 64 38 Q 62 48 50 54 L 50 62" stroke="#fffaf0" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="50" cy="78" r="6" fill="#fffaf0"/>`,
  pause: `<circle cx="50" cy="50" r="46" fill="#d9a02b"/><rect x="32" y="28" width="13" height="44" rx="5" fill="#fffaf0"/><rect x="55" y="28" width="13" height="44" rx="5" fill="#fffaf0"/>`,
  sound: `<path d="M 16 40 L 34 40 L 54 22 L 54 78 L 34 60 L 16 60 Z" fill="#3f7f7c"/><path d="M 64 36 q 12 14 0 28 M 74 26 q 20 24 0 48" stroke="#3f7f7c" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  chairBig: `<rect x="26" y="10" width="48" height="44" rx="10" fill="#c4572e"/><rect x="20" y="50" width="60" height="14" rx="6" fill="#c4572e"/><rect x="45" y="64" width="10" height="20" fill="#9aa5ad"/><ellipse cx="50" cy="88" rx="26" ry="6" fill="#9aa5ad"/>`,
  chairSmall: `<rect x="30" y="26" width="40" height="34" rx="8" fill="#4f8f8a"/><rect x="26" y="58" width="48" height="10" rx="5" fill="#4f8f8a"/><rect x="30" y="68" width="6" height="22" fill="#b97a45"/><rect x="64" y="68" width="6" height="22" fill="#b97a45"/>`,
  heart: `<path d="M 50 84 Q 8 54 18 30 Q 30 10 50 30 Q 70 10 82 30 Q 92 54 50 84 Z" fill="#e07a5f"/>`,
  calendar: `<rect x="12" y="18" width="76" height="70" rx="8" fill="#fffdf6" stroke="#d9c9a3" stroke-width="3"/><rect x="12" y="18" width="76" height="20" rx="8" fill="#e07a5f"/>${[0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => `<rect x="${22 + i * 16}" y="${46 + j * 13}" width="9" height="8" rx="2" fill="#e6dcc6"/>`).join('')).join('')}<circle cx="58.500" cy="63" r="9" fill="none" stroke="#3f7f7c" stroke-width="4"/>`,
  cup: `<path d="M 28 30 L 72 30 L 66 88 L 34 88 Z" fill="#6fa3c8"/><path d="M 31 44 L 69 44 L 66 88 L 34 88 Z" fill="#b9d6ea"/><rect x="54" y="8" width="6" height="50" rx="3" fill="#e07a5f" transform="rotate(12 57 30)"/>`,
  breath: `<path d="M 14 40 L 58 40 Q 72 40 70 28 Q 68 18 58 22 M 14 56 L 74 56 Q 88 56 86 68 Q 84 78 74 74 M 14 72 L 46 72" stroke="#6fa3a0" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  hair: `<path d="M 30 12 q -14 30 0 76 M 50 10 q 12 34 0 80 M 70 12 q -10 36 4 76" stroke="#7a4a2e" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M 14 60 L 86 60" stroke="#e07a5f" stroke-width="4" stroke-dasharray="7 7"/>`,
  home: `<path d="M 12 50 L 50 16 L 88 50 Z" fill="#c4572e"/><rect x="22" y="48" width="56" height="40" fill="#f1e4c8"/><rect x="42" y="60" width="16" height="28" rx="3" fill="#3f7f7c"/>`,
  star: `<path d="M 50 8 L 61 38 L 93 39 L 67 58 L 77 89 L 50 70 L 23 89 L 33 58 L 7 39 L 39 38 Z" fill="#e3b534"/>`,
};

// ---------------------------------------------------------------- backgrounds
export const BACKGROUNDS = {
  plain: (p = {}) => {
    const tone = p.tone || '#f3e6cc';
    return `${wall(tone)}<circle cx="120" cy="140" r="210" fill="#ffffff" opacity=".28"/><circle cx="900" cy="640" r="260" fill="#d9a02b" opacity=".13"/><circle cx="820" cy="110" r="90" fill="#3f7f7c" opacity=".12"/><path d="M 0 620 Q 300 560 600 630 T 1000 600 L 1000 1000 L 0 1000 Z" fill="#00000010"/>`;
  },
  home: () =>
    `${wall('#f3e3c8')}${floor('#d99a5b')}${windowFrame(90, 130, 300, 300)}<ellipse cx="520" cy="700" rx="330" ry="52" fill="#3f7f7c" opacity=".3"/><g transform="translate(600 150) scale(2.2)">${ICONS.calendar}</g>${plant(905, 600, 1.5)}<rect y="560" width="1000" height="40" fill="#a9c9c4"/>`,
  outside: (p = {}) => {
    const salon = p.kind === 'salon';
    const text = p.signText || (salon ? 'Haircuts' : 'Dental Office');
    const size = Math.max(16, Math.min(44, 310 / (Math.max(6, text.length) * 0.56)));
    const face = salon ? '#e9b08f' : '#9cc0b8';
    const trim = salon ? '#c4572e' : '#3f7f7c';
    let s = `${wall('#d5e6e1')}<circle cx="860" cy="110" r="64" fill="#f3d27a" opacity=".8"/><ellipse cx="230" cy="110" rx="120" ry="34" fill="#fff" opacity=".7"/>`;
    s += `<rect x="150" y="150" width="720" height="500" fill="${face}"/><rect x="130" y="130" width="760" height="44" rx="8" fill="${trim}"/>`;
    if (salon) {
      for (let i = 0; i < 8; i++) s += `<path d="M ${190 + i * 80} 330 L ${270 + i * 80} 330 L ${262 + i * 80} 384 Q ${230 + i * 80} 400 ${198 + i * 80} 384 Z" fill="${i % 2 ? '#fbf4e2' : '#c4572e'}"/>`;
    }
    s += `<rect x="290" y="196" width="440" height="110" rx="14" fill="#fbf4e2" stroke="${trim}" stroke-width="6"/><g transform="translate(306 211) scale(.8)">${ICONS[salon ? 'scissors' : 'tooth']}</g><text x="552" y="${251 + size * 0.35}" text-anchor="middle" font-family="ui-rounded, 'Avenir Next', system-ui, sans-serif" font-weight="700" font-size="${size.toFixed(1)}" fill="${INK}">${esc(text)}</text>`;
    s += `<rect x="440" y="400" width="140" height="250" rx="8" fill="#b97a45"/><rect x="460" y="424" width="100" height="100" rx="6" fill="#dcebe6"/><circle cx="560" cy="548" r="8" fill="#e3b534"/>`;
    s += `<rect x="200" y="410" width="190" height="150" rx="8" fill="#dcebe6" stroke="${trim}" stroke-width="10"/><rect x="630" y="410" width="190" height="150" rx="8" fill="#dcebe6" stroke="${trim}" stroke-width="10"/>`;
    s += `<rect y="650" width="1000" height="350" fill="#e6dac2"/><rect y="650" width="1000" height="12" fill="#00000014"/>${tree(70, 660, 1.25)}${plant(930, 660, 1.2)}`;
    return s;
  },
  waiting: (p = {}) => {
    const salon = p.kind === 'salon';
    let s = `${wall(salon ? '#f3dcc4' : '#cfe0d8')}${floor(salon ? '#d9b88a' : '#e9dfca')}<rect y="540" width="1000" height="60" fill="${salon ? '#e9b79a' : '#a9c9c4'}"/>`;
    s += picture(90, 150, salon ? 'scissors' : 'tooth') + windowFrame(330, 130, 250, 230);
    s += smallChair(120, 700) + smallChair(880, 700, '#d9a02b');
    if (!p.noShelf) {
      s += `<rect x="690" y="380" width="250" height="220" rx="8" fill="#b97a45"/>${[0, 1].map((r) => `<rect x="704" y="${396 + r * 100}" width="222" height="86" fill="#f1e4c8"/>${['#e07a5f', '#3f7f7c', '#e3b534', '#6f8f3e', '#6fa3c8'].map((c, i) => `<rect x="${716 + i * 30}" y="${412 + r * 100}" width="22" height="70" rx="3" fill="${c}"/>`).join('')}`).join('')}${plant(815, 380, 1.1)}`;
    }
    return s;
  },
  dentistRoom: () => {
    let s = `${wall('#a9c9c4')}${floor('#e9dfca')}${windowFrame(60, 110, 230, 230)}`;
    s += `<rect x="600" y="440" width="400" height="160" fill="#fbf4e2"/><rect x="580" y="420" width="420" height="26" rx="8" fill="#d9c9a3"/><rect x="630" y="476" width="150" height="100" rx="8" fill="#f1e4c8"/><rect x="810" y="476" width="150" height="100" rx="8" fill="#f1e4c8"/>`;
    s += `<rect x="650" y="350" width="60" height="72" rx="10" fill="#dcebf0" stroke="#9dbfca" stroke-width="4"/><rect x="646" y="340" width="68" height="16" rx="6" fill="#9aa5ad"/><circle cx="668" cy="392" r="10" fill="#fff"/><circle cx="690" cy="398" r="10" fill="#fff"/><circle cx="680" cy="378" r="10" fill="#fff"/>`;
    s += `<rect x="760" y="366" width="44" height="56" rx="8" fill="#6fa3a0"/><rect x="772" y="344" width="20" height="24" fill="#4f8f8a"/><g transform="translate(860 300) scale(1.2)">${ICONS.tooth}</g>`;
    return s;
  },
  salon: () => {
    let s = `${wall('#f4e4c9')}<rect y="470" width="1000" height="130" fill="#e9b79a"/>${floor('#d9b88a')}`;
    s += `<circle cx="500" cy="270" r="170" fill="#d9a02b"/><circle cx="500" cy="270" r="148" fill="#dcebe8"/><path d="M 410 200 q 60 -70 150 -60" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".8"/>`;
    s += `<rect x="740" y="330" width="230" height="16" rx="6" fill="#b97a45"/><rect x="760" y="262" width="40" height="68" rx="8" fill="#6fa3a0"/><rect x="772" y="240" width="16" height="24" fill="#4f8f8a"/><rect x="820" y="278" width="36" height="52" rx="8" fill="#e07a5f"/><rect x="876" y="290" width="60" height="40" rx="6" fill="#3f6f78"/><rect x="884" y="262" width="6" height="34" fill="#b97a45"/><rect x="900" y="256" width="6" height="40" fill="#d9a02b"/><rect x="916" y="264" width="6" height="32" fill="#55606b"/>`;
    s += `<rect x="60" y="110" width="170" height="14" rx="6" fill="#b97a45"/>${plant(145, 110, 1.3)}`;
    return s;
  },
};

// ---------------------------------------------------------------- props
// Anchor = base centre on the floor.
export const PROPS = {
  smallChair: (p) => smallChair(0, 0, p.color || '#4f8f8a'),
  desk: () =>
    `<rect x="-180" y="-270" width="360" height="270" fill="#d9a02b"/><rect x="-200" y="-292" width="400" height="30" rx="8" fill="#b97a45"/><rect x="-100" y="-200" width="200" height="100" rx="10" fill="#fbf4e2"/><g transform="translate(-40 -190) scale(.8)">${ICONS.heart}</g>`,
  examChair: () =>
    `<ellipse cx="0" cy="4" rx="150" ry="16" fill="#00000018"/><rect x="-26" y="-70" width="52" height="70" fill="#9aa5ad"/><rect x="-110" y="-14" width="220" height="18" rx="9" fill="#7d8794"/><rect x="-98" y="-400" width="196" height="270" rx="46" fill="#4f8f8a"/><rect x="-60" y="-446" width="120" height="70" rx="30" fill="#5b9d98"/><rect x="-112" y="-150" width="224" height="52" rx="22" fill="#3f7f7c"/><rect x="-80" y="-108" width="160" height="96" rx="24" fill="#4f8f8a"/><rect x="-140" y="-210" width="40" height="80" rx="16" fill="#3f7f7c"/><rect x="100" y="-210" width="40" height="80" rx="16" fill="#3f7f7c"/>`,
  lamp: (p) => {
    let s = '';
    if (p.on) s += `<path d="M -70 0 L 70 0 L 230 420 L -230 420 Z" fill="#f6e08a" opacity=".3"/>`;
    s += `<path d="M 150 -400 L 150 -150 L 20 -40" stroke="#9aa5ad" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="-95" y="-52" width="190" height="64" rx="28" fill="#fbf4e2" stroke="#9aa5ad" stroke-width="6"/>`;
    for (let i = 0; i < 4; i++) s += `<circle cx="${-57 + i * 38}" cy="-20" r="14" fill="${p.on ? '#f6d860' : '#e6dcc6'}"/>`;
    return s;
  },
  tray: () =>
    `<rect x="-8" y="-150" width="16" height="150" fill="#9aa5ad"/><rect x="-60" y="-10" width="120" height="12" rx="6" fill="#7d8794"/><rect x="-100" y="-176" width="200" height="30" rx="10" fill="#dcebf0" stroke="#9aa5ad" stroke-width="5"/><g transform="translate(-80 -236) scale(.6)">${ICONS.mirror}</g><g transform="translate(-20 -236) scale(.6)">${ICONS.counter}</g><g transform="translate(34 -232) scale(.55)">${ICONS.toothbrush}</g>`,
  salonChair: () =>
    `<ellipse cx="0" cy="4" rx="120" ry="14" fill="#00000018"/><ellipse cx="0" cy="-6" rx="96" ry="14" fill="#9aa5ad"/><rect x="-14" y="-110" width="28" height="104" fill="#b4bcc2"/><rect x="-70" y="-62" width="140" height="12" rx="6" fill="#7d8794"/><rect x="-100" y="-370" width="200" height="220" rx="40" fill="#c4572e"/><rect x="-112" y="-170" width="224" height="60" rx="22" fill="#a94a27"/><rect x="-136" y="-236" width="38" height="96" rx="16" fill="#d9a02b"/><rect x="98" y="-236" width="38" height="96" rx="16" fill="#d9a02b"/>`,
  toolCart: () =>
    `<rect x="-70" y="-180" width="140" height="170" rx="10" fill="#fbf4e2" stroke="#d9c9a3" stroke-width="5"/><rect x="-84" y="-196" width="168" height="22" rx="8" fill="#b97a45"/><circle cx="-50" cy="-4" r="10" fill="#55606b"/><circle cx="50" cy="-4" r="10" fill="#55606b"/><g transform="translate(-72 -262) scale(.62)">${ICONS.sprayBottle}</g><g transform="translate(-14 -258) scale(.6)">${ICONS.comb}</g><g transform="translate(28 -266) scale(.62)">${ICONS.clippers}</g><rect x="-50" y="-150" width="100" height="10" rx="5" fill="#d9c9a3"/><rect x="-50" y="-100" width="100" height="10" rx="5" fill="#d9c9a3"/>`,
  mirrorHeld: () => `<g transform="translate(-70 -140) scale(1.4)">${ICONS.handMirror}</g>`,
  hairBits: () => {
    let s = '';
    [[-120, -20], [-60, 6], [10, -14], [80, 2], [130, -22], [-20, 14], [50, -30], [-90, -40]].forEach(([x, y], i) => {
      s += `<path d="M ${x} ${y} q 8 -10 16 0" stroke="#7a4a2e" stroke-width="4" fill="none" stroke-linecap="round" transform="rotate(${i * 47} ${x} ${y})"/>`;
    });
    return s;
  },
  mist: () => {
    let s = '';
    [[0, 0], [22, -18], [30, 12], [52, -4], [58, -32], [70, 22], [84, -14]].forEach(([x, y]) => {
      s += `<circle cx="${x}" cy="${y}" r="5" fill="#6fa3c8" opacity=".75"/>`;
    });
    return s;
  },
  soundMarks: () => `<path d="M 0 0 q 14 -16 28 0 M -6 26 q 20 -22 40 0 M -12 54 q 26 -28 52 0" stroke="#d9a02b" stroke-width="7" fill="none" stroke-linecap="round"/>`,
};

/**
 * Icon cards. `area` is [x, y, w, h] in page units; cards are laid out in a
 * grid inside it. Labels are single words kept as live text.
 */
export function iconCards(items, area = [120, 150, 760, 520]) {
  const [ax, ay, aw, ah] = area;
  const count = items.length;
  const cols = count <= 3 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / cols);
  const gap = 28;
  const size = Math.min((aw - gap * (cols - 1)) / cols, (ah - gap * (rows - 1)) / rows);
  const totalW = cols * size + (cols - 1) * gap;
  const totalH = rows * size + (rows - 1) * gap;
  let s = '';
  items.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = ax + (aw - totalW) / 2 + col * (size + gap);
    const y = ay + (ah - totalH) / 2 + row * (size + gap);
    const hasLabel = Boolean(it.label);
    const k = (size * (hasLabel ? 0.62 : 0.74)) / 100;
    const iw = 100 * k;
    s += `<rect x="${(x + 6).toFixed(1)}" y="${(y + 8).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${(size * 0.12).toFixed(1)}" fill="#00000014"/>`;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${(size * 0.12).toFixed(1)}" fill="#fffaf0" stroke="#e6d6b4" stroke-width="4"/>`;
    s += `<g transform="translate(${(x + (size - iw) / 2).toFixed(1)} ${(y + size * (hasLabel ? 0.08 : 0.13)).toFixed(1)}) scale(${k.toFixed(3)})">${ICONS[it.icon] || ''}</g>`;
    if (hasLabel) {
      s += `<text x="${(x + size / 2).toFixed(1)}" y="${(y + size * 0.9).toFixed(1)}" text-anchor="middle" font-family="ui-rounded, 'Avenir Next', system-ui, sans-serif" font-weight="700" font-size="${(size * 0.13).toFixed(1)}" fill="${INK}">${esc(it.label)}</text>`;
    }
  });
  return s;
}
