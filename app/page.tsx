import Link from 'next/link';
import SocietyBoard from '@/components/landing/SocietyBoard';
import HowItWorks from '@/components/landing/HowItWorks';
import { Flash } from '@/components/ui';

const services = ['Electrician', 'Plumber', 'Masi', 'Rickshaw', 'AC repair', 'Carpenter', 'Painter', 'Tanki safai', 'Mali', 'Driver', 'Loader / shifting', 'Tutor'];

const faqs = [
  ['Society ke liye kitne paise lagte hain?', 'Society registration, ghar ka record, green/red status aur WhatsApp reminders bilkul free hain.'],
  ['WhatsApp reminder kaise jata hai?', 'App har din list banati hai ke kin gharon ka fund 3 din mein due hai ya late hai. Admin ek button dabata hai aur message pehle se likha hua uske apne WhatsApp mein khul jata hai. Kisi Meta account ya verification ki zaroorat nahi.'],
  ['Kya doosre log mera fund status dekh sakte hain?', 'Nahi. Aap ka status sirf aap aur aap ki society ka admin / collector dekhta hai.'],
  ['Electrician ya plumber par bharosa kaise karein?', 'Har provider ka CNIC verify hota hai, aur sirf woh log rating de sakte hain jinhon ne asal mein usay call kiya ho.'],
  ['Payment kaise hoti hai?', 'Cash collector ko dein, ya JazzCash / Easypaisa / bank se bhej kar screenshot upload karein. Admin verify karta hai aur receipt number milta hai.'],
  ['Mobile app hai?', 'Haan. Website phone par app ki tarah install hoti hai, aur Android app Play Store par aa rahi hai.'],
];

export default function Home({ searchParams }: { searchParams: { ok?: string } }) {
  return (
    <div className="space-y-24 md:space-y-28">
      <Flash searchParams={searchParams} />

      {/* Hero */}
      <section className="grid items-center gap-12 pt-2 md:grid-cols-[1.1fr_1fr] md:pt-8">
        <div>
          <h1 className="max-w-xl text-[2.6rem] font-extrabold leading-[1.05] md:text-[3.6rem]">
            Har ghar ka hisaab, ek nazar mein.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Society ka development fund ab register mein nahi. Har ghar green ya red, baqi walon ko ek click mein WhatsApp
            reminder — aur usi app mein electrician, plumber, masi aur ghar rent / sale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/societies/register" className="btn px-5 py-3 text-base">Society free register karein</Link>
            <Link href="/societies/join" className="btn-outline px-5 py-3 text-base">Main makan malik hoon</Link>
          </div>
          <p className="mt-5 text-sm text-ink-mute">
            Electrician ya plumber hain? <Link href="/provider/register">Free profile banayein</Link>
          </p>
        </div>
        <SocietyBoard />
      </section>

      {/* Three jobs */}
      <section className="space-y-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Society ke teen bare kaam, ek jagah</h2>
          <p className="mt-3 text-ink-soft">Committee ka hisaab, residents ki rozmarra zaroorat, aur ghar ka len-den.</p>
        </div>

        <Feature
          title="Development fund — bina ghar ghar jaye"
          body="2000 ghar ki society mein bhi admin ko ek screen par pata hota hai kis ne diya aur kis ne nahi. Due date se 3 din pehle reminder list khud ban jati hai."
          points={['Green / red status har ghar ka', 'Cash, bank, JazzCash, Easypaisa entry', 'Receipt number + WhatsApp receipt', 'Defaulters ki Excel list']}
          href="/guides/society-admin"
          visual={<FundVisual />}
        />
        <Feature
          reverse
          title="Ghar ke har kaam ke liye bharosemand log"
          body="Apni society aur area ke verified providers, rating ke sath. Profile kholein aur seedha call ya WhatsApp karein."
          points={['CNIC verified providers', 'Sirf asli customer rating de sakta hai', 'Shikayat ka option', 'Koi commission nahi']}
          href="/services"
          linkLabel="Services dekhein"
          visual={
            <div className="panel">
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <span key={s} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-sm font-semibold text-ink-soft">{s}</span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-4 rounded-xl border border-line p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-plate-soft font-display text-lg font-bold text-plate-ink">IA</div>
                <div className="flex-1">
                  <div className="font-semibold">Imran Electric Works</div>
                  <div className="text-xs text-ink-mute">Electrician, AC repair · 9 saal tajurba</div>
                  <div className="mt-0.5 text-sm text-amber-500">★★★★★ <span className="text-xs text-ink-mute">(41)</span></div>
                </div>
                <span className="btn-wa btn-sm">WhatsApp</span>
              </div>
            </div>
          }
        />
        <Feature
          title="Ghar rent ya sale — society verified"
          body="Owner khud listing banata hai. Agar ghar society mein uske naam verified hai to listing par badge lagta hai, taake kiraydar ko pata ho asal malik se baat ho rahi hai."
          points={['Photos, kamre, rent, advance', 'Society, city aur budget filter', 'Seedha owner se call / WhatsApp']}
          href="/properties"
          linkLabel="Listings dekhein"
          visual={
            <div className="panel p-0">
              <div className="flex h-40 items-end rounded-t-2xl bg-gradient-to-br from-brand-100 to-brand-200 p-4">
                <span className="badge bg-paid text-white">✓ Society verified</span>
              </div>
              <div className="p-5">
                <div className="font-display text-2xl font-bold">Rs 45,000 <span className="text-sm font-normal text-ink-mute">/ mahina</span></div>
                <div className="mt-1 font-semibold">5 marla, upper portion, 3 bed</div>
                <div className="text-sm text-ink-mute">Block C, Gali 7</div>
              </div>
            </div>
          }
        />
      </section>

      {/* How it works */}
      <section className="rounded-3xl bg-white p-6 md:p-10">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Kaise chalta hai?</h2>
        <p className="mb-8 mt-2 text-ink-soft">Apna kirdar choose karein.</p>
        <HowItWorks />
      </section>

      {/* Guides */}
      <section className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-center">
        <div>
          <h2 className="font-display text-3xl font-bold">Har qadam ki guide</h2>
          <p className="mt-3 text-ink-soft">Society admin, collector, makan malik, provider — har kisi ke liye Roman Urdu mein seedhi guide. Pehli dafa use karne walon ke liye.</p>
          <Link href="/guides" className="btn mt-6">Saari guides</Link>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {[
            ['Society admin', 'Society setup se pehli payment tak', '/guides/society-admin'],
            ['Makan malik', 'Ghar add karna, status, payment', '/guides/makan-malik'],
            ['Collector', 'Cash entry aur receipts', '/guides/collector'],
            ['WhatsApp reminders', 'Ek click mein baqi walon ko message', '/guides/whatsapp-reminders'],
            ['Service provider', 'Profile, verification, rating', '/guides/service-provider'],
            ['Phone par install', 'Android aur iPhone', '/guides/app-install'],
          ].map(([t, d, h]) => (
            <li key={h} className="bg-white">
              <Link href={h} className="block p-5 no-underline hover:bg-canvas hover:no-underline">
                <div className="font-semibold text-ink">{t}</div>
                <div className="text-sm text-ink-mute">{d}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="grid gap-8 md:grid-cols-[1fr_1.6fr]">
        <h2 className="font-display text-3xl font-bold">Aksar pooche jane wale sawal</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-xl leading-none text-ink-mute transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-800 px-6 py-12 text-white md:px-12">
        <div className="relative z-10 max-w-xl">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Apni society ko aaj hi shamil karein</h2>
          <p className="mt-3 text-brand-100">Registration free hai. Approve hote hi admin panel mil jata hai.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/societies/register" className="btn bg-plate text-plate-ink hover:bg-yellow-400">Society register karein</Link>
            <Link href="/guides/society-admin" className="btn border border-white/30 bg-transparent hover:bg-white/10">Pehle guide parhein</Link>
          </div>
        </div>
        <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 grid-cols-5 gap-2 opacity-90 md:grid" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
            <span key={n} className={`plate h-9 w-11 text-sm ${[4, 9, 13].includes(n) ? 'plate-due' : 'plate-paid'}`}>{n}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function Feature({
  title, body, points, href, linkLabel = 'Guide parhein', visual, reverse,
}: {
  title: string; body: string; points: string[]; href: string; linkLabel?: string; visual: React.ReactNode; reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <div className={reverse ? 'md:order-2' : ''}>
        <h3 className="font-display text-2xl font-bold">{title}</h3>
        <p className="mt-3 text-ink-soft">{body}</p>
        <ul className="mt-5 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[15px]">
              <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0 text-paid" fill="currentColor" aria-hidden="true"><path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" /></svg>
              {p}
            </li>
          ))}
        </ul>
        <Link href={href} className="mt-6 inline-block font-semibold">{linkLabel}</Link>
      </div>
      <div className={reverse ? 'md:order-1' : ''}>{visual}</div>
    </div>
  );
}

function FundVisual() {
  const rows = [
    ['C-7-3', 'Bilal Ahmed', '3 din baqi', false],
    ['C-7-8', 'Ahmed Raza', '3 din baqi', true],
    ['C-7-11', 'Sana Tariq', '2 din late', false],
  ] as const;
  return (
    <div className="panel">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-semibold">Aaj ke reminders</div>
        <span className="badge bg-due-soft text-due">6 baqi</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map(([plate, name, when, sent]) => (
          <li key={plate} className="flex items-center gap-3 py-3">
            <span className="plate h-7 px-2 text-[11px]">{plate}</span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-xs text-ink-mute">Rs 2,000 · {when}</div>
            </div>
            {sent ? <span className="btn-sm rounded-lg bg-line px-3 py-1.5 text-xs font-semibold text-ink-mute">Bhej diya</span> : <span className="btn-wa btn-sm">WhatsApp</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
