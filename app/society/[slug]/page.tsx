/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { createPublicClient } from '@/lib/supabase/public';
import { mySocietyIds } from '@/lib/notices';
import { bannerImage, projectCategoryLabel, projectImage, projectStatus } from '@/lib/hub';
import { fmtDate, rs, storagePublicUrl } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { jsonLd, siteUrl } from '@/lib/seo';
import NoticeBoard from '@/components/NoticeBoard';
import Avatar from '@/components/Avatar';
import NoticeIcon from '@/components/NoticeIcon';

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { data: s } = await createPublicClient().from('societies').select('*').eq('slug', params.slug).maybeSingle();
  if (!s) return { title: 'Society' };
  const title = `${s.name}, ${s.city} — society page, welfare aur development`;
  const description =
    (s.tagline ? `${s.tagline}. ` : '') +
    `${s.name} ${s.city}: ${s.welfare_name ?? 'welfare committee'}${s.chairman_name ? `, chairman ${s.chairman_name}` : ''}. Development kaam, fund ka hisaab, gali-war welfare agents aur notices.`;
  return { title, description, alternates: { canonical: `/society/${s.slug}` }, openGraph: { title, description, images: [bannerImage(s)] } };
}

export default async function SocietyHub({ params }: Params) {
  const { supabase, user } = await getSession();
  const { data: s } = await supabase.from('societies').select('*').eq('slug', params.slug).maybeSingle();
  if (!s) notFound();

  const [{ data: statsRows }, { data: agents }, { data: projects }, { data: chairRows }, memberOf, staff] = await Promise.all([
    supabase.rpc('society_hub_stats', { sid: s.id }),
    supabase.rpc('society_hub_agents', { sid: s.id }),
    supabase.from('society_projects').select('*').eq('society_id', s.id).order('sort').order('created_at'),
    supabase.rpc('society_hub_chairman', { sid: s.id }),
    user ? mySocietyIds(supabase, user.id) : Promise.resolve([] as string[]),
    user ? supabase.rpc('is_society_staff', { sid: s.id }).then((r) => !!r.data) : Promise.resolve(false),
  ]);
  const st = ((statsRows ?? []) as any[])[0] ?? {};
  const chair = ((chairRows ?? []) as any[])[0] as { name: string; avatar_path: string | null } | undefined;
  const isMember = memberOf.includes(s.id);
  const list = (projects ?? []) as any[];
  const groups = [
    { id: 'in_progress', title: 'Abhi jari kaam', items: list.filter((p) => p.status === 'in_progress') },
    { id: 'done', title: 'Mukammal ho chuke', items: list.filter((p) => p.status === 'done') },
    { id: 'planned', title: 'Agla plan', items: list.filter((p) => p.status === 'planned') },
  ].filter((g) => g.items.length);
  const welfareName = s.welfare_name || `${s.name} Welfare Committee`;
  const amenities: string[] = s.amenities ?? [];
  const agentList = (agents ?? []) as { area: string; name: string; linked: boolean }[];

  const stats = [
    { label: 'Ghar', value: Number(st.houses ?? s.total_houses ?? 0).toLocaleString('en-US') },
    { label: 'Galiyan', value: st.galis ?? '—' },
    { label: 'Welfare agents', value: st.agents ?? agentList.length },
    { label: 'Registered ghar walay', value: st.residents ?? '—' },
    { label: 'Masle hal hue', value: st.issues_resolved ?? 0 },
    { label: 'Avg hal ka waqt', value: st.avg_hours != null ? `${st.avg_hours} ghante` : '—' },
  ];

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: s.name,
    description: s.about ?? s.tagline ?? undefined,
    address: { '@type': 'PostalAddress', streetAddress: s.address ?? undefined, addressLocality: s.city, addressCountry: 'PK' },
    url: `${siteUrl()}/society/${s.slug}`,
    image: bannerImage(s).startsWith('/') ? `${siteUrl()}${bannerImage(s)}` : bannerImage(s),
  };

  const sections = [
    ['taaruf', 'Taaruf'],
    ['development', 'Development'],
    ['hisaab', 'Hisaab'],
    ['welfare', 'Welfare'],
    ...(amenities.length ? [['sahuliyat', 'Sahuliyat']] : []),
    ['rabta', 'Rabta'],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <div className="space-y-12 md:space-y-16">
        {/* ============ HERO BANNER ============ */}
        <section className="relative overflow-hidden rounded-3xl border border-line bg-white">
          <div className="relative h-48 sm:h-60 md:absolute md:inset-0 md:h-auto"><img src={bannerImage(s)} alt={`${s.name} — society ka manzar`} className="h-full w-full object-cover" /></div>
          <div className="absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-white md:from-30% md:via-white/70 md:via-55% md:to-white/0 md:to-80%" />
          <div className="relative grid gap-8 p-6 pb-28 md:min-h-[36rem] md:grid-cols-[1.3fr_1fr] md:content-center md:p-12 md:pb-28">
            <div className="max-w-xl">
              <p className="eyebrow text-brand-700">{welfareName}</p>
              <h1 className="mt-3 text-[1.9rem] leading-[1.15] md:text-[3.2rem]">{s.name}</h1>
              {s.tagline && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{s.tagline}</p>}
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-sm text-ink-soft ring-1 ring-inset ring-line">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
                {s.address || s.city}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {isMember ? (
                  <>
                    <Link href="/welfare" className="btn px-5">Masla report karein</Link>
                    <Link href={`/hisaab/${s.id}`} className="btn-outline px-5">Fund ka hisaab</Link>
                  </>
                ) : (
                  <>
                    <Link href={`/societies/join?society=${s.id}`} className="btn px-5">Apna ghar add karein</Link>
                    <a href="#development" className="btn-outline px-5">Development dekhein</a>
                  </>
                )}
                {staff && <Link href={`/s/${s.id}`} className="btn-ghost px-4">Admin panel →</Link>}
              </div>
            </div>
            {chair && (
              <div className="self-end justify-self-start rounded-2xl bg-white/90 p-5 shadow-lift ring-1 ring-line backdrop-blur md:justify-self-end">
                <div className="flex items-center gap-4">
                  <Avatar name={chair.name} src={storagePublicUrl(chair.avatar_path)} size={64} />
                  <div>
                    <div className="eyebrow">Chairman</div>
                    <div className="mt-0.5 text-lg font-semibold">{chair.name}</div>
                    <div className="text-sm text-ink-mute">{welfareName}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============ NUMBERS ============ */}
        <section aria-label="Society ke numbers" className="relative z-10 !-mt-20 mx-3 md:mx-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((x) => (
            <div key={x.label} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
              <div className="text-2xl font-semibold tracking-tight text-ink">{x.value}</div>
              <div className="mt-0.5 text-xs text-ink-mute">{x.label}</div>
            </div>
          ))}
        </section>

        {/* sticky section tabs */}
        <nav aria-label="Is page par" className="sticky top-16 z-20 -mx-4 border-b border-line bg-canvas/95 px-4 backdrop-blur md:mx-0 md:rounded-xl md:border md:bg-white/95">
          <ul className="flex gap-6 overflow-x-auto [scrollbar-width:none]">
            {sections.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="block whitespace-nowrap py-3 text-sm font-medium text-ink-mute no-underline hover:text-ink hover:no-underline md:px-1">{label}</a></li>
            ))}
          </ul>
        </nav>

        {isMember && <NoticeBoard societyIds={[s.id]} next={`/society/${s.slug}`} title={`${s.name} — notices`} />}

        {/* ============ ABOUT ============ */}
        <section id="taaruf" className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="card md:p-8">
            <p className="eyebrow">Taaruf</p>
            <h2 className="mt-1 text-2xl">{s.name} ke baare mein</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">
              {s.about ||
                `${s.name}, ${s.city} ki rehaishi society hai. Society ka intezam ${welfareName} chalati hai — fund ka hisaab, gali-war welfare agents aur development ka har kaam is page par.`}
            </p>
            <dl className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <div><dt className="text-xs text-ink-mute">Shehar</dt><dd className="font-semibold">{s.city}</dd></div>
              {s.established && <div><dt className="text-xs text-ink-mute">Qayam</dt><dd className="font-semibold">{s.established}</dd></div>}
              <div><dt className="text-xs text-ink-mute">Intezamiya</dt><dd className="font-semibold">{welfareName}</dd></div>
            </dl>
          </div>
          <div className="card flex flex-col md:p-8">
            <p className="eyebrow">Chairman ka paigham</p>
            <blockquote className="mt-4 flex-1 text-[17px] leading-relaxed text-ink">
              &ldquo;Hamari koshish hai ke har ghar ko saaf gali, roshan raatein aur mehfooz mahol mile — aur jo fund aap dete hain, us ka har rupay aap ke saamne ho. Koi masla ho to apni gali ke welfare agent ko app se batayein; hum jawabdeh hain.&rdquo;
            </blockquote>
            {chair && (
              <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <Avatar name={chair.name} src={storagePublicUrl(chair.avatar_path)} size={44} />
                <div className="text-sm"><div className="font-semibold">{chair.name}</div><div className="text-ink-mute">Chairman, {welfareName}</div></div>
              </div>
            )}
          </div>
        </section>

        {/* ============ DEVELOPMENT ============ */}
        <section id="development" className="scroll-mt-32">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Development</p>
              <h2 className="mt-1 text-2xl md:text-3xl">Society mein kya ho raha hai</h2>
              <p className="mt-2 max-w-2xl text-ink-mute">Street lights, safai, sarkein, sewerage aur security — har kaam ka status, kharcha aur tareekh.</p>
            </div>
          </div>
          {groups.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-ink-mute">Abhi koi development kaam darj nahi.</p>
          ) : (
            <div className="mt-8 space-y-10">
              {groups.map((g) => (
                <div key={g.id}>
                  <h3 className="mb-4 flex items-center gap-2 text-ink-soft">{g.title} <span className="text-sm font-normal text-ink-mute">({g.items.length})</span></h3>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((p) => (
                      <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
                        <div className="relative aspect-[16/10] bg-canvas">
                          <img src={projectImage(p)} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                          <span className={`badge absolute left-3 top-3 ${projectStatus[p.status]?.cls}`}>{projectStatus[p.status]?.label}</span>
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="text-xs font-medium text-brand-700">{projectCategoryLabel(p.category)}{p.area ? ` · ${p.area}` : ''}</div>
                          <h4 className="mt-1 font-semibold leading-snug">{p.title}</h4>
                          {p.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-mute">{p.description}</p>}
                          {p.status !== 'planned' && (
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-ink-mute"><span>Progress</span><span>{p.progress}%</span></div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-line">
                                <div className={`h-full rounded-full ${p.status === 'done' ? 'bg-paid' : 'bg-brand-500'}`} style={{ width: `${p.progress}%` }} />
                              </div>
                            </div>
                          )}
                          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-ink-mute">
                            {p.cost ? <div><dt className="sr-only">Kharcha</dt><dd>{p.status === 'done' ? 'Kharcha' : 'Andaza'}: <b className="text-ink-soft">{rs(p.cost)}</b></dd></div> : null}
                            {p.status === 'done' && p.completed_on ? <div><dd>Mukammal: <b className="text-ink-soft">{fmtDate(p.completed_on)}</b></dd></div> : null}
                            {p.status !== 'done' && p.target_date ? <div><dd>Target: <b className="text-ink-soft">{fmtDate(p.target_date)}</b></dd></div> : null}
                          </dl>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============ HISAAB ============ */}
        <section id="hisaab" className="scroll-mt-32 grid gap-6 rounded-3xl border border-line bg-white p-6 md:grid-cols-[1.2fr_1fr] md:p-10">
          <div>
            <p className="eyebrow">Shaffaf hisaab</p>
            <h2 className="mt-1 text-2xl md:text-3xl">Har rupay ka hisaab</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Development fund ki har payment ki receipt banti hai aur har kharcha raseed ke sath darj hota hai. Verified makan malik aur kirayedar mahina-war jama aur kharch dekh sakte hain — gali-war bhi.
            </p>
            <Link href={isMember ? `/hisaab/${s.id}` : `/societies/join?society=${s.id}`} className="btn-outline mt-6">
              {isMember ? 'Poora hisaab dekhein' : 'Ghar add kar ke hisaab dekhein'}
            </Link>
          </div>
          <div className="grid content-center gap-3">
            <div className="rounded-2xl bg-paid-soft p-5">
              <div className="text-sm text-paid-ink">Is saal jama hua</div>
              <div className="mt-1 text-3xl font-semibold text-paid-ink">{rs(st.collected_year ?? 0)}</div>
            </div>
            <div className="rounded-2xl bg-canvas p-5 ring-1 ring-inset ring-line">
              <div className="text-sm text-ink-mute">Is saal kharch hua (approved)</div>
              <div className="mt-1 text-3xl font-semibold text-ink">{rs(st.spent_year ?? 0)}</div>
            </div>
          </div>
        </section>

        {/* ============ WELFARE ============ */}
        <section id="welfare" className="scroll-mt-32">
          <p className="eyebrow">Welfare system</p>
          <h2 className="mt-1 text-2xl md:text-3xl">Har gali ka ek zimmedar</h2>
          <p className="mt-2 max-w-2xl text-ink-mute">Street light band hai, gutter ubal raha hai ya koi legal masla — app mein ek click, masla seedha apni gali ke welfare agent ke WhatsApp par. Hal hone tak har qadam ka record.</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Masla report karein', 'Category chunein, chahein to photo lagayein. Message apni gali ke agent ko jata hai.'],
              ['2', 'Agent jawab deta hai', 'Agent masla qubool karta hai, kaam karwata hai — har update aap ko nazar aata hai.'],
              ['3', 'Aap confirm karein', 'Kaam ho gaya to aap confirm karte hain aur rating dete hain. Dono taraf hara.'],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-2xl border border-line bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">{n}</span>
                <h3 className="mt-3">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-mute">{d}</p>
              </li>
            ))}
          </ol>
          {agentList.length > 0 && (
            <div className="mt-8 rounded-2xl border border-line bg-white p-5 md:p-6">
              <h3>Welfare agents</h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {agentList.map((a) => (
                  <li key={a.area + a.name} className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5">
                    <Avatar name={a.name} size={34} />
                    <div className="min-w-0 text-sm">
                      <div className="truncate font-medium">{a.name}</div>
                      <div className="text-xs text-ink-mute">{a.area}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ============ AMENITIES ============ */}
        {amenities.length > 0 && (
          <section id="sahuliyat" className="scroll-mt-32">
            <p className="eyebrow">Sahuliyat</p>
            <h2 className="mt-1 text-2xl md:text-3xl">Society mein kya kya hai</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {amenities.map((a) => (
                <li key={a} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ CONTACT + FAQ ============ */}
        <section id="rabta" className="scroll-mt-32 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="card md:p-8">
            <p className="eyebrow">Rabta</p>
            <h2 className="mt-1 text-2xl">Society office</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-ink-mute">Pata</dt><dd className="font-medium">{s.address || s.city}</dd></div>
              {s.office_hours && <div><dt className="text-ink-mute">Office timings</dt><dd className="font-medium">{s.office_hours}</dd></div>}
              {s.office_phone && <div><dt className="text-ink-mute">Office number</dt><dd><a href={`tel:+${s.office_phone}`} className="font-medium">{displayPhone(s.office_phone)}</a></dd></div>}
              <div><dt className="text-ink-mute">Intezamiya</dt><dd className="font-medium">{welfareName}{chair ? ` — Chairman ${chair.name}` : ''}</dd></div>
            </dl>
            {s.map_url && <a href={s.map_url} target="_blank" rel="noopener" className="btn-outline mt-6">Map par dekhein</a>}
            <div className="mt-6 rounded-xl bg-canvas p-4 text-sm text-ink-soft">
              Ghar ki marammat ke liye verified electrician, plumber ya masi chahiye? <Link href="/services">Home services dekhein →</Link>
            </div>
          </div>
          <div className="card md:p-8">
            <p className="eyebrow">Aksar pooche jane wale sawal</p>
            <div className="mt-4 divide-y divide-line">
              {[
                ['Main app par apna ghar kaise add karun?', `"Apna ghar add karein" dabayein, gali aur ghar number chunein. Society admin verify karega, phir aap ka fund status, notices aur welfare sab khul jayega.`],
                ['Kirayedar bhi add ho sakta hai?', 'Ji haan. Ghar add karte waqt "Kirayedar" chunein. Kirayedar ko society ke notices milte hain aur woh masla report kar sakta hai; fund ke reminders sirf malik ko jate hain.'],
                ['Notice kaun bhejta hai?', `Sirf chairman${chair ? ` (${chair.name})` : ''}. Har notice par bhejne wale ka naam, photo aur masle ki tareekh hoti hai. Masla hal hone par ya tareekh ke 24 ghante baad notice khud hat jata hai.`],
                ['Mera fund kahan lagta hai?', 'Har kharcha raseed ke sath darj hota hai aur chairman ki manzoori ke baad "Fund ka hisaab" mein sab ko nazar aata hai.'],
                ['Masla hal na ho to?', 'Har masle ka waqt muqarrar hai. Late hone par woh admin ko laal nazar aata hai, aur aap "dobara kholein" bhi kar sakte hain.'],
              ].map(([q, a]) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {q}
                    <span className="text-ink-mute transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mute">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {!isMember && (
          <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-brand-100 bg-brand-50 p-6 md:flex-row md:items-center md:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-inset ring-brand-200"><NoticeIcon kind="info" /></span>
              <div>
                <h2 className="text-xl">{s.name} mein rehte hain?</h2>
                <p className="mt-1 text-ink-soft">Apna ghar add karein — chairman ke notices, apni gali ka welfare agent aur fund ka hisaab, sab ek jagah.</p>
              </div>
            </div>
            <Link href={`/societies/join?society=${s.id}`} className="btn shrink-0 px-6">Apna ghar add karein</Link>
          </section>
        )}
      </div>
    </>
  );
}
