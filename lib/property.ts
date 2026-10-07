// Options and labels for the property module (sale and rent kept separate).
export type Deal = 'sale' | 'rent';

export const propertyTypes: { id: string; label: string; sale: boolean; rent: boolean }[] = [
  { id: 'house', label: 'Ghar (poora)', sale: true, rent: true },
  { id: 'portion', label: 'Portion (upper / lower)', sale: false, rent: true },
  { id: 'flat', label: 'Flat / apartment', sale: true, rent: true },
  { id: 'room', label: 'Kamra', sale: false, rent: true },
  { id: 'plot', label: 'Plot', sale: true, rent: false },
  { id: 'shop', label: 'Dukaan / commercial', sale: true, rent: true },
  { id: 'office', label: 'Office', sale: true, rent: true },
  { id: 'farmhouse', label: 'Farmhouse', sale: true, rent: true },
];
export const typeLabel = (id?: string | null) => propertyTypes.find((t) => t.id === id)?.label ?? 'Ghar';
export const typesFor = (deal: Deal) => propertyTypes.filter((t) => t[deal]);

export const areaUnits = [
  { id: 'marla', label: 'Marla' },
  { id: 'kanal', label: 'Kanal' },
  { id: 'sqft', label: 'Sq. ft' },
  { id: 'sqyd', label: 'Sq. yard' },
];
export const sizeLabel = (v?: number | string | null, u?: string | null, fallback?: string | null) =>
  v ? `${Number(v).toLocaleString('en-US')} ${areaUnits.find((x) => x.id === u)?.label ?? ''}`.trim() : fallback ?? '';

export const portions = [
  { id: 'full', label: 'Poora ghar' },
  { id: 'upper', label: 'Upper portion' },
  { id: 'lower', label: 'Lower portion' },
  { id: 'room', label: 'Kamra' },
];
export const portionLabel = (id?: string | null) => portions.find((p) => p.id === id)?.label ?? '';

export const furnishing = [
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'semi', label: 'Semi furnished' },
  { id: 'furnished', label: 'Furnished' },
];
export const furnishLabel = (id?: string | null) => furnishing.find((f) => f.id === id)?.label ?? '';

export const ownershipTypes = [
  { id: 'registry', label: 'Registry' },
  { id: 'inteqal', label: 'Inteqal / fard' },
  { id: 'allotment', label: 'Allotment letter (society)' },
  { id: 'file', label: 'File' },
  { id: 'poa', label: 'Power of attorney' },
  { id: 'lease', label: 'Lease (99 saal)' },
];
export const ownershipLabel = (id?: string | null) => ownershipTypes.find((o) => o.id === id)?.label ?? '';

export const possessionTypes = [
  { id: 'ready', label: 'Tayyar — qabza foran' },
  { id: 'construction', label: 'Zer-e-tameer' },
  { id: 'tenant', label: 'Kirayedar mojood' },
];
export const possessionLabel = (id?: string | null) => possessionTypes.find((o) => o.id === id)?.label ?? '';

export const tenantPrefs = [
  { id: 'family', label: 'Sirf family' },
  { id: 'bachelor', label: 'Bachelors bhi' },
  { id: 'female', label: 'Sirf khawateen' },
  { id: 'any', label: 'Koi bhi' },
];
export const tenantLabel = (id?: string | null) => tenantPrefs.find((o) => o.id === id)?.label ?? '';

export const facings = ['Mashriq (East)', 'Maghrib (West)', 'Shumal (North)', 'Junoob (South)'];

export const utilityOptions = ['Bijli', 'Sui gas', 'Pani (WASA)', 'Boring / motor', 'Alag meter', 'Internet / fiber'];

export const featureOptions = [
  'Drawing room', 'TV lounge', 'Dining', 'Store', 'Servant quarter', 'Laundry', 'Lawn / garden', 'Roof / chhat',
  'Solar', 'UPS wiring', 'Gas geyser', 'CCTV', 'Boundary wall', 'Lift', 'Basement', 'Gated / security',
];

/** "Rs 1.25 crore", "Rs 45 lakh", "Rs 35,000" — how people read prices in Pakistan. */
export function pkPrice(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  if (v >= 10_000_000) return `Rs ${(v / 10_000_000).toFixed(v % 10_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')} crore`;
  if (v >= 100_000) return `Rs ${(v / 100_000).toFixed(v % 100_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')} lakh`;
  return `Rs ${v.toLocaleString('en-PK')}`;
}

export const dealLabel = (d: Deal) => (d === 'sale' ? 'Sale' : 'Rent');

/** Columns a listing card needs (browse pages, seller profile, dashboard). */
export const CARD_SELECT =
  'id, owner_id, listing_type, property_type, title, city, area_text, plot_size, area_value, area_unit, bedrooms, bathrooms, portion, furnished, price, negotiable, installments, possession, tenant_pref, available_from, society_verified, status, views, created_at, corner, park_facing, society:societies(name), listing_photos(path, sort)';

export const firstPhoto = (l: { listing_photos?: { path: string; sort: number }[] | null }) =>
  [...(l.listing_photos ?? [])].sort((a, b) => a.sort - b.sort)[0]?.path ?? null;

/** Clean a lakh / crore style number from a search box ("50 lakh" → 5000000). */
export function parseMoney(v?: string | null): number | null {
  if (!v) return null;
  const s = v.toLowerCase().replace(/,/g, '').trim();
  const m = s.match(/^([\d.]+)\s*(crore|cr|lakh|lac|k)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const mult = m[2]?.startsWith('c') ? 10_000_000 : m[2] === 'lakh' || m[2] === 'lac' ? 100_000 : m[2] === 'k' ? 1000 : 1;
  return Math.round(n * mult);
}

export const statusLabel: Record<string, string> = { active: 'Live', hidden: 'Chupi hui', sold: 'Bik gaya', rented: 'Kiraye par chala gaya' };
