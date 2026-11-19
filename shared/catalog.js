// Next Up Books — catalog FIXTURE. Everything here is sample data standing in
// for Shopify products/variants and for owner-confirmed print specifications.
// Titles, concepts, referral partners and the asset index are DATA. They are
// loaded from the content/ folder (server) or from /api/catalog (browser) and
// registered here, so adding a title never means editing the editor.
export const TITLES = {};
export const ASSETS = { files: {}, digest: 'none' };
export const CONCEPTS = [];
export const PARTNERS = {};

export function registerCatalog(data) {
  for (const k of Object.keys(TITLES)) delete TITLES[k];
  for (const t of data.titles || []) TITLES[t.id] = t;
  ASSETS.files = data.assets?.files || {};
  ASSETS.digest = data.assets?.digest || 'none';
  CONCEPTS.length = 0;
  CONCEPTS.push(...(data.concepts || []));
  for (const k of Object.keys(PARTNERS)) delete PARTNERS[k];
  Object.assign(PARTNERS, data.partners || {});
}

export const CONFIG = {
  shop: 'photobook-press-dev.fixture',
  currency: 'USD',
  designProperty: '_nub_design', // private line item property (leading underscore)
  refAttribute: 'nub_ref', // cart attribute carrying an optional referral code
  bleedIn: 0.125, // ASSUMPTION until the plant confirms
  trimIn: 8.5,
  designTtlMinutes: 24 * 60, // unpurchased reservations expire
  proofLinkMinutes: 15,
  sampleShippingCents: 600, // sample value from the plan; real rate unconfirmed
  pageCountRange: [22, 34],
  digitalEditionEnabled: false, // optional pilot test, off in this prototype
};

export const BINDINGS = {
  softcover: {
    id: 'softcover',
    label: 'Softcover',
    trim: '8.5 × 8.5 in',
    priceCents: 3499,
    priceNote: 'Test price from the pilot plan',
    blurb: 'Flexible cover, light to carry to the appointment.',
    // UNCONFIRMED production inputs — see README "Questions for the owner".
    spec: { confirmed: false, allowedPageCounts: [24, 28, 32], spine: 'unconfirmed', cover: 'unconfirmed' },
  },
  hardcover: {
    id: 'hardcover',
    label: 'Hardcover',
    trim: '8.5 × 8.5 in',
    priceCents: 4499,
    priceNote: 'Pricing hypothesis, not yet verified',
    blurb: 'Rigid cover that stands up to many re-reads.',
    spec: { confirmed: false, allowedPageCounts: [24, 28, 32], wrap: 'unconfirmed', hinge: 'unconfirmed', endpapers: 'unconfirmed' },
  },
};

// Variants come from each title's title.json ("variants"). IDs there mimic
// Shopify variant IDs until real products exist.
export const allVariants = () => Object.values(TITLES).flatMap((t) => (t.variants || []).map((v) => ({ ...v, titleId: t.id, priceCents: BINDINGS[v.binding].priceCents })));
export const variantById = (id) => allVariants().find((v) => String(v.id) === String(id)) || null;
export const variantFor = (titleId, binding) => allVariants().find((v) => v.titleId === titleId && v.binding === binding) || null;

export const OPTIONS = {
  ageBand: [
    { id: '', label: 'Not specified' },
    { id: '4-5', label: '4–5' },
    { id: '6-7', label: '6–7' },
    { id: '8-9', label: '8–9' },
  ],
  pronouns: [
    { id: 'none', label: 'Use the name only' },
    { id: 'she', label: 'she / her' },
    { id: 'he', label: 'he / him' },
    { id: 'they', label: 'they / them' },
  ],
  skin: [
    { id: 's1', label: 'Skin tone 1 (lightest)' }, { id: 's2', label: 'Skin tone 2' }, { id: 's3', label: 'Skin tone 3' },
    { id: 's4', label: 'Skin tone 4' }, { id: 's5', label: 'Skin tone 5' }, { id: 's6', label: 'Skin tone 6 (deepest)' },
  ],
  hairStyle: [
    { id: 'curls', label: 'Curls' }, { id: 'bob', label: 'Bob with fringe' }, { id: 'puffs', label: 'Two puffs' },
    { id: 'wavy', label: 'Wavy, shoulder length' }, { id: 'short', label: 'Short' },
  ],
  hairColor: [
    { id: 'black', label: 'Black' }, { id: 'brown', label: 'Brown' }, { id: 'red', label: 'Red' }, { id: 'blonde', label: 'Blonde' },
  ],
  eyes: [
    { id: 'brown', label: 'Brown' }, { id: 'hazel', label: 'Hazel' }, { id: 'green', label: 'Green' }, { id: 'blue', label: 'Blue' }, { id: 'gray', label: 'Gray' },
  ],
  outfit: [
    { id: 'cardigan', label: 'Rust cardigan' }, { id: 'collar', label: 'Blue collar top' }, { id: 'leaf', label: 'Green leaf sweatsuit' },
    { id: 'flower', label: 'Lilac flower tee' }, { id: 'pocket', label: 'Yellow pocket tee' },
  ],
  supports: [
    { id: 'glasses', label: 'Glasses' }, { id: 'hearingAids', label: 'Hearing aids' },
    { id: 'earDefenders', label: 'Ear defenders' }, { id: 'aac', label: 'AAC device' },
  ],
  mobility: [
    { id: 'none', label: 'None' }, { id: 'wheelchair', label: 'Wheelchair' }, { id: 'walker', label: 'Walker' },
  ],
  comfort: [
    { id: 'none', label: 'None' }, { id: 'bunny', label: 'Soft bunny' }, { id: 'bear', label: 'Soft bear' },
  ],
};

export const DEFAULT_CHARACTER = {
  name: '', pronouns: 'none', ageBand: '',
  skin: 's4', hairStyle: 'curls', hairColor: 'black', eyes: 'brown', outfit: 'cardigan',
  supports: [], mobility: 'none', comfort: 'none',
};

export const NAME_MAX = 24;
export const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

export const money = (cents) => `$${(cents / 100).toFixed(2)}`;
