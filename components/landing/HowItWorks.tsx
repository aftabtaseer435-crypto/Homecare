'use client';

import Link from 'next/link';
import { useState } from 'react';

const roles = [
  {
    id: 'admin',
    tab: 'Society admin',
    steps: [
      ['Society register karein', 'Free form bharein. Hamari team call kar ke verify karti hai aur aap ko admin panel mil jata hai.'],
      ['Ghar add karein', 'Gali 1 se 40, har gali mein 50 ghar — ek form se 2000 ghar ban jate hain. Ya Excel se paste karein.'],
      ['Fund plan banayein', 'Amount aur due tareekh likhein. Har mahine ka hisaab khud banta hai.'],
      ['Reminder aur payment', 'Baqi gharon ko ek click se WhatsApp reminder. Payment entry par receipt number aur WhatsApp receipt.'],
    ],
    guide: '/guides/society-admin',
    cta: ['Society register karein', '/societies/register'],
  },
  {
    id: 'owner',
    tab: 'Makan malik',
    steps: [
      ['Mobile number se login', 'Password nahi — SMS code se login.'],
      ['Apna ghar choose karein', 'Society, gali aur ghar number choose karein. Admin approve karta hai.'],
      ['Status dekhein', 'Green ya red — kitna jama hua, kitna baqi, kab tak.'],
      ['Payment proof bhejein', 'JazzCash / Easypaisa ka screenshot upload karein. Verify hote hi receipt mil jati hai.'],
    ],
    guide: '/guides/makan-malik',
    cta: ['Apna ghar add karein', '/societies/join'],
  },
  {
    id: 'provider',
    tab: 'Electrician / plumber',
    steps: [
      ['Profile banayein', 'Naam, number, kaam, area aur rates. Photo lagayein.'],
      ['CNIC verification', 'CNIC ki photo upload karein — sirf admin dekhta hai. Verify hote hi list mein aa jate hain.'],
      ['Kaam aata hai', 'Log aap ko seedha call ya WhatsApp karte hain. Koi commission nahi.'],
      ['Rating banayein', 'Acha kaam = achi rating = zyada kaam.'],
    ],
    guide: '/guides/service-provider',
    cta: ['Provider banein', '/provider/register'],
  },
  {
    id: 'property',
    tab: 'Rent / sale',
    steps: [
      ['Listing banayein', 'Rent ya sale, price, kamre, photos.'],
      ['Verified badge', 'Agar ghar society mein aap ke naam verified hai to listing par "Society verified" badge lagta hai.'],
      ['Seedha rabta', 'Kiraydar ya kharidar aap ko call / WhatsApp karta hai — beech mein koi dealer nahi.'],
      ['Rent ho gaya?', 'Ek click se listing band.'],
    ],
    guide: '/guides/ghar-rent-sale',
    cta: ['Ghar list karein', '/properties/new'],
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(roles[0].id);
  const role = roles.find((r) => r.id === active)!;
  return (
    <div>
      <div role="tablist" aria-label="Aap kaun hain?" className="flex gap-2 overflow-x-auto pb-1">
        {roles.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={r.id === active}
            onClick={() => setActive(r.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${r.id === active ? 'bg-ink text-white' : 'bg-white text-ink-soft hover:text-ink'}`}
          >
            {r.tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {role.steps.map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="plate h-8 shrink-0 text-sm">{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p className="mt-1 text-sm text-ink-mute">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 md:flex-col">
          <Link href={role.cta[1]} className="btn">{role.cta[0]}</Link>
          <Link href={role.guide} className="btn-outline">Poori guide parhein</Link>
        </div>
      </div>
    </div>
  );
}
