// Small real photos (Unsplash, free licence) per service category.
// Categories added later from the admin panel fall back to their emoji icon.
const base: Record<string, string> = {
  electrician: 'photo-1621905251189-08b45d6a269e',
  plumber: 'photo-1676210134188-4c05dd172f89',
  carpenter: 'photo-1547609434-b732edfee020',
  painter: 'photo-1717281234297-3def5ae3eee1',
  'ac-repair': 'photo-1762341123870-d706f257a12e',
  'appliance-repair': 'photo-1604335399105-a0c585fd81a1',
  mason: 'photo-1701850009190-2859ba2aeea6',
  welder: 'photo-1504328345606-18bbc8c9d7d1',
  solar: 'photo-1668097613572-40b7c11c8727',
  'cctv-internet': 'photo-1549109926-58f039549485',
  maid: 'photo-1758273238415-01ec03d9ef27',
  cook: 'photo-1585937421612-70a008356fbe',
  driver: 'photo-1449965408869-eaa3f722e40d',
  gardener: 'photo-1622383563227-04401ab4e5ea',
  guard: 'photo-1485230405346-71acb9518d9c',
  rickshaw: 'photo-1626149637281-4e227308da18',
  loader: 'photo-1601467995997-ac1ae9a8fff4',
  'school-van': 'photo-1573086490982-98a5ce8fa45d',
  'deep-cleaning': 'photo-1563453392212-326f5e854473',
  'tank-cleaning': 'photo-1541941392960-652036ca567e',
  'pest-control': 'photo-1747659629851-a92bd71149f6',
  sewerage: 'photo-1697497709686-c433fce09de4',
  tailor: 'photo-1466027397211-20d0f2449a3f',
  laundry: 'photo-1489274495757-95c7c837b101',
  tutor: 'photo-1599689868384-59cb2b01bb21',
  beautician: 'photo-1709477542149-f4e0e21d590b',
  'chicken-meat': 'photo-1587593810167-a84920ea0781',
  'sabzi-fruit': 'photo-1611693424421-3db00de93a89',
  rashan: 'photo-1704972269889-f0fdd7f0e7c3',
  medicine: 'photo-1587854692152-cbe660dbde88',
  bakery: 'photo-1509440159596-0249088772ff',
  'night-food': 'photo-1589302168068-964664d93dc0',
  milk: 'photo-1550583724-b2692b85b150',
  'water-cans': 'photo-1536939459926-301728717817',
  'gas-cylinder': 'photo-1503027470001-baf3fb214fe5',
};

/** Square thumbnail URL for a category, or null (use the emoji). */
export function serviceImage(slug: string, size = 128) {
  const id = base[slug];
  return id ? `https://images.unsplash.com/${id}?w=${size}&h=${size}&fit=crop&auto=format&q=70` : null;
}

export const DELIVERY_GROUP = 'Rozmarra saman (ghar tak)';
