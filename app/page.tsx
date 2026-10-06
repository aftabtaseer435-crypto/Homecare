import Link from 'next/link';
import SocietyBoard from '@/components/landing/SocietyBoard';
import HowItWorks from '@/components/landing/HowItWorks';
import { Flash } from '@/components/ui';
import { appName, jsonLd, siteUrl } from '@/lib/seo';

export const metadata = {
  title: { absolute: `${appName} — Society fund app, home services aur ghar rent / sale` },
  alternates: { canonical: '/' },
};

const services = ['Electrician', 'Plumber', 'Masi', 'Rickshaw', 'AC repair', 'Carpenter', 'Painter', 'Tanki safai', 'Mali', 'Driver', 'Shifting', 'Tutor'];

const faqs: [string, string][] = [
  ['Society ke liye kitne paise lagte hain?', 'Society registration, ghar ka record, green/red status aur WhatsApp reminders free hain.'],
  ['WhatsApp reminder kaise jata hai?', 'App roz list banati hai ke kin gharon ka fund 3 din mein due hai ya late hai. Admin ek button dabata hai aur message pehle se likha hua uske apne WhatsApp mein khul jata hai. Kisi Meta account ya verification ki zaroorat nahi.'],
  ['Kya doosre log mera fund status dekh sakte hain?', 'Nahi. Aap ka status sirf aap aur aap ki society ka admin / collector dekhta hai.'],
  ['Electrician ya plumber par bharosa kaise karein?', 'Har provider ka CNIC verify hota hai, aur sirf woh log rating de sakte hain jinhon ne asal mein usay call ya WhatsApp kiya ho.'],
  ['Payment kaise hoti hai?', 'Cash collector ko dein, ya JazzCash / Easypaisa / bank se bhej kar screenshot upload karein. Admin verify karta hai aur receipt number milta hai.'],
  ['Mobile app hai?', 'Haan. Website phone par app ki tarah install hoti hai, aur Android app Play Store par aa rahi hai.'],
];

export default function Home({ searchParams }: { searchParams: { ok?: string } }) {
  const url = siteUrl();
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: appName, url, logo: `${url}/icons/icon-512.png`, areaServed: 'PK' },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: appName, url, inLanguage: 'en-PK' },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: appName,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PKR' },
      description: 'Housing society development fund management with WhatsApp reminders, home services directory and property rent/sale.',
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    <div className="space-y-20 md:space-y-24">
      <Flash searchParams={searchParams} />

      {/* Hero — what the product is, and the three doors into it */}
      <section className="grid items-start gap-10 pt-2 lg:grid-cols-[1.15fr_1fr] lg:pt-6">
        <div>
          <h1 className="max-w-xl text-[2.35rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Society ka hisaab aur ghar ke kaam, ek app mein.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Development fund ka green / red record, ek click WhatsApp reminders, verified electrician aur plumber, aur
            society-verified ghar rent ya sale. Teeno alag, teeno ek login se.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/societies/register" className="btn px-5 py-3 text-base">Society free register karein</Link>
            <Link href="/societies/join" className="btn-outline px-5 py-3 text-base">Main makan malik hoon</Link>
          </div>
        </div>

        <ul className="grid gap-3" aria-label="App ke teen hisse">
          <ModuleDoor href="/society" color="bg-society" name="Society Fund" body="Har ghar green ya red, reminders, receipts, defaulters" />
          <ModuleDoor href="/services" color="bg-service" name="Home Services" body="Electrician, plumber, masi, rickshaw — CNIC verified" />
          <ModuleDoor href="/properties" color="bg-property" name="Rent / Sale" body="Society-verified ghar, seedha owner se baat" />
        </ul>
      </section>

      {/* MODULE 1 — Society Fund */}
      <ModuleSection
        id="society"
        tone="society"
        eyebrow="Society Fund"
        title="Development fund — bina ghar ghar jaye"
        body="2000 ghar ki society mein bhi admin ek screen par dekhta hai kis ne diya aur kis ne nahi. Due date se 3 din pehle reminder list khud ban jati hai."
        points={['Har ghar ka green / red status', 'Cash, bank, JazzCash, Easypaisa entry', 'Receipt number aur WhatsApp receipt', 'Defaulters ki Excel list']}
        primary={['Society register karein', '/societies/register']}
        secondary={['Society Fund ke baare mein', '/society']}
        visual={<SocietyBoard />}
      />

      {/* MODULE 2 — Home Services */}
      <ModuleSection
        id="services"
        tone="service"
        eyebrow="Home Services"
        title="Ghar ke har kaam ke liye bharosemand log"
        body="Apni society aur area ke verified providers, rating ke sath. Profile kholein aur seedha call ya WhatsApp karein. Koi commission nahi."
        points={['CNIC verified providers', 'Sirf asli customer rating de sakta hai', 'Shikayat ka option', 'Apni society ke providers pehle']}
        primary={['Service dhoondein', '/services']}
        secondary={['Provider banein', '/provider/register']}
        reverse
        visual={
          <div className="panel">
            <ul className="flex flex-wrap gap-2" aria-label="Services">
              {services.map((s) => (
                <li key={s} className="rounded-full border border-service/25 bg-service-soft px-3 py-1.5 text-sm font-bold text-service-ink">{s}</li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-line p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-service-soft text-lg font-extrabold text-service-ink">IE</div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">Imran Electric Works</div>
                <div className="text-xs text-ink-mute">Electrician, AC repair · 9 saal tajurba</div>
                <div className="mt-0.5 text-sm text-amber-600">★★★★★ <span className="text-xs text-ink-mute">(41)</span></div>
              </div>
              <span className="btn-wa btn-sm">WhatsApp</span>
            </div>
          </div>
        }
      />

      {/* MODULE 3 — Rent / Sale */}
      <ModuleSection
        id="property"
        tone="property"
        eyebrow="Rent / Sale"
        title="Ghar rent ya sale — society verified"
        body="Owner khud listing banata hai. Agar ghar society mein uske naam verified hai to listing par badge lagta hai, taake kiraydar ko pata ho asal malik se baat ho rahi hai."
        points={['Photos, kamre, rent, advance', 'Society, city aur budget filter', 'Seedha owner se call / WhatsApp']}
        primary={['Ghar dekhein', '/properties']}
        secondary={['Apna ghar list karein', '/properties/new']}
        visual={
          <div className="panel overflow-hidden p-0">
            <div className="flex h-40 items-end bg-gradient-to-br from-property-soft to-[#DCCDFB] p-4">
              <span className="badge bg-paid text-white">✓ Society verified</span>
            </div>
            <div className="p-5">
              <div className="text-2xl font-extrabold">Rs 45,000 <span className="text-sm font-medium text-ink-mute">/ mahina</span></div>
              <div className="mt-1 font-bold">5 marla, upper portion, 3 bed</div>
              <div className="text-sm text-ink-mute">Block C, Gali 7</div>
            </div>
          </div>
        }
      />

      {/* How it works */}
      <section className="rounded-3xl bg-white p-5 md:p-10" aria-labelledby="how">
        <h2 id="how" className="text-3xl font-extrabold md:text-4xl">Kaise chalta hai?</h2>
        <p className="mb-8 mt-2 text-ink-soft">Apna kirdar choose karein.</p>
        <HowItWorks />
      </section>

      {/* FAQ */}
      <section className="grid gap-8 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="faq">
        <div>
          <h2 id="faq" className="text-3xl font-extrabold">Aksar pooche jane wale sawal</h2>
          <p className="mt-3 text-ink-soft">Aur sawal hain? <Link href="/guides">Guides</Link> mein har qadam likha hai.</p>
        </div>
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                {q}
                <span className="text-xl leading-none text-ink-mute transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-[15px] text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-white md:px-12">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">Apni society ko aaj hi shamil karein</h2>
          <p className="mt-3 text-white/85">Registration free hai. Approve hote hi admin panel mil jata hai.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/societies/register" className="btn bg-plate text-plate-ink hover:bg-[#FFC933]">Society register karein</Link>
            <Link href="/guides/society-admin" className="btn border border-white/40 bg-transparent hover:bg-white/10">Pehle guide parhein</Link>
          </div>
        </div>
        <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 grid-cols-5 gap-2 lg:grid" aria-hidden="true">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
            <span key={n} className={`plate h-9 w-11 text-sm ${[4, 9, 13].includes(n) ? 'plate-due' : 'plate-paid'}`}>{n}</span>
          ))}
        </div>
      </section>
    </div>
    </>
  );
}

function ModuleDoor({ href, color, name, body }: { href: string; color: string; name: string; body: string }) {
  return (
    <li>
      <Link href={href} className="group flex items-stretch overflow-hidden rounded-2xl border border-line bg-white no-underline shadow-sm transition-shadow hover:shadow-lift hover:no-underline">
        <span className={`w-2 shrink-0 ${color}`} aria-hidden="true" />
        <span className="flex flex-1 items-center justify-between gap-4 p-5">
          <span>
            <span className="block text-lg font-extrabold text-ink">{name}</span>
            <span className="block text-sm text-ink-mute">{body}</span>
          </span>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color} text-white transition-transform group-hover:translate-x-0.5`} aria-hidden="true">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4z" /></svg>
          </span>
        </span>
      </Link>
    </li>
  );
}

const tones = {
  society: { bar: 'bg-society', chip: 'bg-society-soft text-society-ink', check: 'text-society', btn: 'bg-society hover:bg-society-ink' },
  service: { bar: 'bg-service', chip: 'bg-service-soft text-service-ink', check: 'text-service', btn: 'bg-service hover:bg-service-ink' },
  property: { bar: 'bg-property', chip: 'bg-property-soft text-property-ink', check: 'text-property', btn: 'bg-property hover:bg-property-ink' },
};

function ModuleSection({
  id, tone, eyebrow, title, body, points, primary, secondary, visual, reverse,
}: {
  id: string; tone: keyof typeof tones; eyebrow: string; title: string; body: string; points: string[];
  primary: [string, string]; secondary: [string, string]; visual: React.ReactNode; reverse?: boolean;
}) {
  const t = tones[tone];
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative">
      <div className={`mb-6 h-1 w-16 rounded-full ${t.bar}`} aria-hidden="true" />
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className={reverse ? 'lg:order-2' : ''}>
          <span className={`badge ${t.chip} px-3 py-1 text-sm`}>{eyebrow}</span>
          <h2 id={`${id}-title`} className="mt-3 text-3xl font-extrabold leading-tight">{title}</h2>
          <p className="mt-3 text-[16px] text-ink-soft">{body}</p>
          <ul className="mt-5 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px]">
                <svg viewBox="0 0 20 20" className={`mt-1 h-4 w-4 shrink-0 ${t.check}`} fill="currentColor" aria-hidden="true"><path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" /></svg>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={primary[1]} className={`btn ${t.btn}`}>{primary[0]}</Link>
            <Link href={secondary[1]} className="btn-outline">{secondary[0]}</Link>
          </div>
        </div>
        <div className={reverse ? 'lg:order-1' : ''}>{visual}</div>
      </div>
    </section>
  );
}
