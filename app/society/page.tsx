import Link from 'next/link';
import SocietyBoard from '@/components/landing/SocietyBoard';
import { jsonLd } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Society development fund app — green / red status aur WhatsApp reminders',
  description:
    'Housing society ka development / maintenance fund online: har ghar ka green-red status, cash aur JazzCash entry, receipt number, defaulters list aur due date se 3 din pehle WhatsApp reminder. Society registration free.',
  alternates: { canonical: '/society' },
};

const steps: [string, string][] = [
  ['Society free register karein', 'Form bharein, hamari team call kar ke verify karti hai, aur admin panel mil jata hai.'],
  ['Ghar add karein', 'Gali 1 se 40, har gali mein 50 ghar — ek form se 2000 ghar. Ya Excel se paste karein.'],
  ['Fund plan banayein', 'Amount aur due tareekh. Monthly, quarterly, saalana ya ek dafa.'],
  ['Owners jorein', 'Log khud apna ghar choose kar ke request bhejte hain, ya admin naam aur number daal deta hai.'],
  ['Reminder aur payment', 'Baqi gharon ko ek click WhatsApp, payment par receipt number aur WhatsApp receipt.'],
];

const features: [string, string][] = [
  ['Har rupay ka hisaab', 'Kitna jama hua, kahan kharch hua, raseed ke sath — har verified makan malik dekh sakta hai.'],
  ['Gali ka welfare agent', 'Har block / gali ka zimmedar. Light ya legal masla ek click mein us tak, WhatsApp par.'],
  ['Masle ka poora status', 'Laal → peela → hara. Agent hal kare, resident confirm kare — waqt aur rating sab record.'],
  ['Green / red board', 'Poori society gali-war plates mein: jama, baqi, aadha, exempt.'],
  ['WhatsApp reminders', '3 din pehle, due din aur late hone par — list khud banti hai, bhejna ek click.'],
  ['Payments aur receipts', 'Cash, bank, JazzCash, Easypaisa. Screenshot verify, receipt number.'],
  ['Defaulters Excel', 'Late gharon ki list, owner ka naam aur number, ek click download.'],
  ['Team roles', 'Admin sab kuch, collector sirf payment entry.'],
  ['Notices', 'Notice likhein aur society ke WhatsApp group mein share karein.'],
];

export const revalidate = 300;

export default async function SocietyLanding() {
  const supabase = createClient();
  const { data: societies } = await supabase
    .from('societies')
    .select('id, name, slug, city, total_houses')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(12);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Society ka development fund app par kaise chalayein',
    step: steps.map(([name, text], i) => ({ '@type': 'HowToStep', position: i + 1, name, text })),
  };
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    <div className="space-y-16 md:space-y-24">
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow">Society fund · Welfare · Hisaab</p>
          <h1 className="mt-3 text-[2.1rem] leading-[1.15] md:text-5xl md:leading-[1.1]">Aap ka fund, aap ka haq — har rupay ka hisaab.</h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">
            Har ghar ek plate: green matlab jama, red matlab baqi. Jo fund deta hai woh dekhta hai paisa kahan laga, aur gali ka welfare agent har masle ka jawabdeh hai.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/societies/register" className="btn bg-society px-5">Society free register karein</Link>
            <Link href="/societies/join" className="btn-outline px-5">Apna ghar add karein</Link>
          </div>
        </div>
        <SocietyBoard />
      </section>

      {(societies ?? []).length > 0 && (
        <section aria-labelledby="live">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Live</p>
              <h2 id="live" className="mt-1 text-2xl md:text-3xl">App par societies</h2>
            </div>
            <Link href="/societies/join" className="text-sm font-medium">Apni society dhoondein →</Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(societies ?? []).map((s) => (
              <li key={s.id}>
                <Link href={`/society/${s.slug}`} className="flex h-full items-center gap-4 rounded-2xl border border-line bg-white p-5 no-underline transition-colors hover:border-society hover:no-underline">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-society-soft text-base font-semibold text-society-ink" aria-hidden="true">
                    {s.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{s.name}</span>
                    <span className="block text-sm text-ink-mute">{s.city}{s.total_houses ? ` · ${s.total_houses.toLocaleString('en-US')} ghar` : ''}</span>
                  </span>
                  <span className="text-sm font-medium text-society-ink">Dekhein →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="features">
        <p className="eyebrow">Features</p>
        <h2 id="features" className="mt-1 text-2xl md:text-3xl">Is mein kya hai</h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d]) => (
            <div key={t} className="bg-white p-6">
              <h3>{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-mute">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps" className="rounded-3xl border border-line bg-white p-6 md:p-12">
        <p className="eyebrow">5 qadam</p>
        <h2 id="steps" className="mt-1 text-2xl md:text-3xl">Shuru kaise karein</h2>
        <ol className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-society-soft text-sm font-semibold text-society-ink">{i + 1}</span>
              <div><h3>{t}</h3><p className="mt-1 text-sm leading-relaxed text-ink-mute">{d}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/guides/society-admin" className="btn bg-society">Poori admin guide</Link>
          <Link href="/guides/makan-malik" className="btn-outline">Makan malik guide</Link>
        </div>
      </section>
    </div>
    </>
  );
}
