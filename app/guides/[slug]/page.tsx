import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuide, guides } from '@/lib/guides';

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  return g ? { title: g.title, description: g.summary } : {};
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) notFound();
  const others = guides.filter((x) => x.slug !== g.slug).slice(0, 4);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_17rem]">
      <article>
        <Link href="/guides" className="text-sm font-semibold">Saari guides</Link>
        <h1 className="mt-3 text-4xl font-extrabold">{g.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">{g.summary}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-mute">
          <span>Kis ke liye: <b className="text-ink-soft">{g.who}</b></span>
          <span>Waqt: <b className="text-ink-soft">{g.time}</b></span>
        </div>

        <ol className="relative mt-10 space-y-0">
          {g.steps.map((s, i) => (
            <li key={s.title} id={`step-${i + 1}`} className="relative flex gap-5 pb-10 last:pb-0">
              {i < g.steps.length - 1 && <span className="absolute left-[1.15rem] top-10 h-[calc(100%-2.5rem)] w-px bg-line" aria-hidden="true" />}
              <span className="plate relative z-10 h-9 w-9 shrink-0 text-sm">{i + 1}</span>
              <div className="min-w-0 flex-1 pt-1">
                <h2 className="font-display text-xl font-bold">{s.title}</h2>
                <p className="mt-2 max-w-2xl leading-7 text-ink-soft">{s.body}</p>
                {s.tip && (
                  <div className="mt-3 max-w-2xl rounded-xl border-l-4 border-plate bg-plate-soft px-4 py-3 text-sm text-plate-ink">
                    <b>Tip:</b> {s.tip}
                  </div>
                )}
                {s.link && <Link href={s.link[1]} className="btn-outline btn-sm mt-3">{s.link[0]}</Link>}
              </div>
            </li>
          ))}
        </ol>

        {g.faq && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold">Sawal jawab</h2>
            <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
              {g.faq.map(([q, a]) => (
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
        )}
      </article>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <nav className="hidden rounded-2xl border border-line bg-white p-4 lg:block" aria-label="Is guide mein">
          <div className="mb-2 text-sm font-semibold text-ink-mute">Is guide mein</div>
          <ol className="space-y-1.5 text-sm">
            {g.steps.map((s, i) => (
              <li key={s.title}><a href={`#step-${i + 1}`} className="text-ink-soft no-underline hover:text-ink">{i + 1}. {s.title}</a></li>
            ))}
          </ol>
        </nav>
        <div className="rounded-2xl bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-ink-mute">Doosri guides</div>
          <ul className="space-y-2 text-sm">
            {others.map((o) => <li key={o.slug}><Link href={`/guides/${o.slug}`}>{o.title}</Link></li>)}
          </ul>
        </div>
      </aside>
    </div>
  );
}
