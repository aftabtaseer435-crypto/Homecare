import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 px-6 py-12 text-white md:px-12">
        <h1 className="text-3xl font-bold md:text-4xl">Apni society, ek hi app mein</h1>
        <p className="mt-3 max-w-2xl text-brand-100">
          Development fund ka hisaab, WhatsApp reminders, bharosemand electrician / plumber / masi,
          aur ghar rent ya sale — sab kuch yahan.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/societies/register" className="btn bg-white text-brand-700 hover:bg-brand-50">Society register karein (Free)</Link>
          <Link href="/societies/join" className="btn-outline border-white/40 bg-transparent text-white hover:bg-white/10">Main makan malik hoon</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature
          title="Development Fund"
          text="Har ghar ka status green (jama) ya red (baqi). Due date se 3 din pehle WhatsApp reminder khud chala jata hai."
          href="/societies/join"
          cta="Apna ghar register karein"
        />
        <Feature
          title="Home Services"
          text="Electrician, plumber, masi, rickshaw, AC repair — verified providers, rating ke sath. Seedha call ya WhatsApp."
          href="/services"
          cta="Service dhoondein"
        />
        <Feature
          title="Rent / Sale"
          text="Society-verified ghar rent ya sale ke liye. Owner se seedha baat."
          href="/properties"
          cta="Ghar dekhein"
        />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>Aap electrician, plumber ya koi bhi service dete hain?</h2>
          <p className="muted">Free profile banayein aur apne area ki societies se kaam lein.</p>
        </div>
        <Link href="/provider/register" className="btn">Provider ban kar register karein</Link>
      </section>
    </div>
  );
}

function Feature({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="card flex flex-col">
      <h2>{title}</h2>
      <p className="muted mt-2 flex-1">{text}</p>
      <Link href={href} className="mt-4 text-sm font-semibold">{cta} →</Link>
    </div>
  );
}
