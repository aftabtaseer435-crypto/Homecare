import Link from 'next/link';
import SocietyBoard from '@/components/landing/SocietyBoard';
import { jsonLd } from '@/lib/seo';

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

export default function SocietyLanding() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Society ka development fund app par kaise chalayein',
    step: steps.map(([name, text], i) => ({ '@type': 'HowToStep', position: i + 1, name, text })),
  };
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="badge bg-society-soft px-3 py-1 text-sm text-society-ink">Society</span>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">Aap ka fund, aap ka haq: har rupay ka hisaab.</h1>
          <p className="mt-4 max-w-lg text-lg text-ink-soft">
            Har ghar ek plate: green matlab jama, red matlab baqi. Jo fund deta hai woh dekhta hai paisa kahan laga, aur gali ka welfare agent har masle ka jawabdeh hai.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/societies/register" className="btn bg-society px-5 py-3 text-base">Society free register karein</Link>
            <Link href="/societies/join" className="btn-outline px-5 py-3 text-base">Apna ghar add karein</Link>
          </div>
        </div>
        <SocietyBoard />
      </section>

      <section aria-labelledby="features">
        <h2 id="features" className="text-2xl font-extrabold md:text-3xl">Is mein kya hai</h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d]) => (
            <div key={t} className="bg-white p-5">
              <h3>{t}</h3>
              <p className="mt-1 text-sm text-ink-mute">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps" className="rounded-3xl bg-white p-5 md:p-10">
        <h2 id="steps" className="text-2xl font-extrabold md:text-3xl">Shuru kaise karein</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-2">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="plate h-9 w-9 shrink-0 text-sm">{i + 1}</span>
              <div><h3>{t}</h3><p className="mt-1 text-sm text-ink-mute">{d}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/guides/society-admin" className="btn bg-society">Poori admin guide</Link>
          <Link href="/guides/makan-malik" className="btn-outline">Makan malik guide</Link>
        </div>
      </section>
    </div>
    </>
  );
}
