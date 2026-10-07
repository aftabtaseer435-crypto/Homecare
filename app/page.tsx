import Link from 'next/link';
import { Flash } from '@/components/ui';
import { appName, jsonLd, siteUrl } from '@/lib/seo';

export const metadata = {
  title: { absolute: `${appName} — Society fund app, home services aur ghar rent / sale` },
  alternates: { canonical: '/' },
};

const faqs: [string, string][] = [
  ['Society ke liye kitne paise lagte hain?', 'Society registration, ghar ka record, green/red status aur WhatsApp reminders free hain.'],
  ['WhatsApp reminder kaise jata hai?', 'App roz list banati hai ke kin gharon ka fund 3 din mein due hai ya late hai. Admin ek button dabata hai aur message pehle se likha hua uske apne WhatsApp mein khul jata hai. Kisi Meta account ya verification ki zaroorat nahi.'],
  ['Kya doosre log mera fund status dekh sakte hain?', 'Nahi. Aap ka status sirf aap aur aap ki society ka admin / collector dekhta hai.'],
  ['Electrician ya plumber par bharosa kaise karein?', 'Har provider ka CNIC verify hota hai, aur sirf woh log rating de sakte hain jinhon ne asal mein usay call ya WhatsApp kiya ho.'],
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
    <div className="space-y-14 md:space-y-20">
      <Flash searchParams={searchParams} />

      {/* Hero — what the product is, and the three doors into it */}
      <section className="grid items-start gap-10 pt-2 lg:grid-cols-[1.15fr_1fr] lg:pt-6">
        <div>
          <h1 className="max-w-xl text-[2.35rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Society ka hisaab aur ghar ke kaam, ek app mein.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-ink-soft">Society fund, ghar ki services aur property — ek login se.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/societies/register" className="btn px-5 py-3 text-base">Society free register karein</Link>
            <Link href="/societies/join" className="btn-outline px-5 py-3 text-base">Main makan malik hoon</Link>
          </div>
        </div>

        <ul className="grid gap-3" aria-label="App ke teen hisse">
          <ModuleDoor href="/society" color="bg-society" name="Society" body="Fund green / red, har rupay ka hisaab, gali ke masle" />
          <ModuleDoor href="/services" color="bg-service" name="Home Services" body="Electrician, plumber, masi, rozmarra saman — order aur history" />
          <ModuleDoor href="/properties" color="bg-property" name="Rent / Sale" body="Ghar khareedein, bechein ya kiraye par — alag alag" />
        </ul>
      </section>

      {/* FAQ */}
      <section className="grid gap-8 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="faq">
        <div>
          <h2 id="faq" className="text-3xl font-bold">Aksar pooche jane wale sawal</h2>
          <p className="mt-3 text-ink-soft"><Link href="/guides">Guides</Link> mein har qadam likha hai.</p>
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
            <span className="block text-lg font-bold text-ink">{name}</span>
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
