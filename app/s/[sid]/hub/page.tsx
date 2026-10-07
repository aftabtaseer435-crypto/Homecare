/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { requireSocietyStaff } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { bannerImage, projectCategories, projectImage, projectStatus } from '@/lib/hub';
import { displayPhone } from '@/lib/phone';
import { deleteProject, saveHub, saveProject } from './actions';

function ProjectFields({ p }: { p?: any }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="label">Kaam ka naam *</label><input name="title" className="input" required defaultValue={p?.title} placeholder="LED street lights — Gali 1 se 8" /></div>
      <div>
        <label className="label">Kis cheez ka kaam</label>
        <select name="category" className="input" defaultValue={p?.category ?? 'lights'}>
          {projectCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select name="status" className="input" defaultValue={p?.status ?? 'planned'}>
          <option value="planned">Agla plan</option>
          <option value="in_progress">Kaam jari</option>
          <option value="done">Mukammal</option>
        </select>
      </div>
      <div><label className="label">Area</label><input name="area" className="input" defaultValue={p?.area ?? ''} placeholder="Gali 1 – 8 / Poori society" /></div>
      <div><label className="label">Kharcha / andaza (Rs)</label><input name="cost" type="number" min="0" className="input" defaultValue={p?.cost ?? ''} /></div>
      <div><label className="label">Progress % (jari kaam)</label><input name="progress" type="number" min="0" max="100" className="input" defaultValue={p?.progress ?? 0} /></div>
      <div><label className="label">Target tareekh</label><input name="target_date" type="date" className="input" defaultValue={p?.target_date ?? ''} /></div>
      <div><label className="label">Mukammal hone ki tareekh</label><input name="completed_on" type="date" className="input" defaultValue={p?.completed_on ?? ''} /></div>
      <div><label className="label">Tarteeb (chhota = pehle)</label><input name="sort" type="number" className="input" defaultValue={p?.sort ?? 100} /></div>
      <div className="sm:col-span-2"><label className="label">Tafseel</label><textarea name="description" rows={3} className="input" defaultValue={p?.description ?? ''} /></div>
      <div className="sm:col-span-2">
        <label className="label">Asli photo (optional — warna illustration lagegi)</label>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2 text-sm" />
        {p?.image_path && <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="remove_image" /> Photo hata kar illustration lagayein</label>}
      </div>
    </div>
  );
}

export default async function HubEditor({ params, searchParams }: { params: { sid: string }; searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSocietyStaff(params.sid, true);
  const [{ data: s }, { data: projects }] = await Promise.all([
    supabase.from('societies').select('*').eq('id', params.sid).single(),
    supabase.from('society_projects').select('*').eq('society_id', params.sid).order('sort').order('created_at'),
  ]);
  if (!s) return null;

  return (
    <div className="space-y-8">
      <Flash searchParams={searchParams} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Society page</p>
          <h1 className="mt-1">Society ka hub page</h1>
          <p className="muted mt-1 max-w-2xl">Ye page sab ke liye khula hai: banner, chairman, welfare committee, development kaam aur rabta. Jo yahan likhein ge wahi page par nazar aayega.</p>
        </div>
        <Link href={`/society/${s.slug}`} target="_blank" className="btn-outline">Page dekhein ↗</Link>
      </div>

      <form action={saveHub} className="card space-y-6">
        <input type="hidden" name="sid" value={params.sid} />
        <div>
          <h2>Banner aur taaruf</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <img src={bannerImage(s)} alt="" className="h-40 w-full object-cover" />
          </div>
          <label className="label mt-3" htmlFor="banner">Naya banner (wide photo, 1600×640 behtar)</label>
          <input id="banner" name="banner" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2 text-sm" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="label">Welfare committee ka naam</label><input name="welfare_name" className="input" defaultValue={s.welfare_name ?? ''} placeholder={`${s.name} Welfare Committee`} /></div>
          <div><label className="label">Tagline</label><input name="tagline" className="input" maxLength={120} defaultValue={s.tagline ?? ''} placeholder="Saaf galiyan, roshan raatein" /></div>
          <div><label className="label">Chairman ka naam</label><input name="chairman_name" className="input" defaultValue={s.chairman_name ?? ''} /></div>
          <div>
            <label className="label">Chairman ka mobile</label>
            <input name="chairman_phone" className="input" defaultValue={s.chairman_phone ? displayPhone(s.chairman_phone) : ''} placeholder="0300 1234567" />
            <p className="hint">Notice sirf isi number wala account bhej sakta hai. {s.chairman_user_id ? 'Account linked ✓' : 'Is number se pehli login par khud link ho jayega.'}</p>
          </div>
          <div className="md:col-span-2"><label className="label">Society ke baare mein</label><textarea name="about" rows={5} className="input" defaultValue={s.about ?? ''} /></div>
          <div className="md:col-span-2"><label className="label">Sahuliyat (har line par ek)</label><textarea name="amenities" rows={4} className="input" defaultValue={(s.amenities ?? []).join('\n')} placeholder={'Jamia Masjid\nBachon ka park\nMain gate security'} /></div>
          <div className="md:col-span-2"><label className="label">Pata</label><input name="address" className="input" defaultValue={s.address ?? ''} /></div>
          <div><label className="label">Office number</label><input name="office_phone" className="input" defaultValue={s.office_phone ? displayPhone(s.office_phone) : ''} /></div>
          <div><label className="label">Office timings</label><input name="office_hours" className="input" defaultValue={s.office_hours ?? ''} placeholder="Somvar – Hafta, 10 se 6" /></div>
          <div><label className="label">Google Maps link</label><input name="map_url" className="input" defaultValue={s.map_url ?? ''} placeholder="https://maps.google.com/..." /></div>
          <div><label className="label">Qayam (saal)</label><input name="established" className="input" defaultValue={s.established ?? ''} placeholder="2015" /></div>
        </div>
        <SubmitButton>Save karein</SubmitButton>
      </form>

      <section id="projects" className="space-y-4">
        <h2>Development kaam ({(projects ?? []).length})</h2>
        <div className="grid gap-4">
          {((projects ?? []) as any[]).map((p) => (
            <details key={p.id} className="card group">
              <summary className="flex cursor-pointer list-none items-center gap-4">
                <img src={projectImage(p)} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.title}</div>
                  <div className="text-xs text-ink-mute">{p.area ?? ''}{p.status === 'in_progress' ? ` · ${p.progress}%` : ''}</div>
                </div>
                <span className={`badge ${projectStatus[p.status]?.cls}`}>{projectStatus[p.status]?.label}</span>
                <span className="text-sm text-brand-700 group-open:hidden">Edit</span>
              </summary>
              <form action={saveProject} className="mt-5 space-y-4 border-t border-line pt-5">
                <input type="hidden" name="sid" value={params.sid} />
                <input type="hidden" name="id" value={p.id} />
                <ProjectFields p={p} />
                <div className="flex items-center gap-3">
                  <SubmitButton>Update</SubmitButton>
                </div>
              </form>
              <form action={deleteProject} className="mt-3">
                <input type="hidden" name="sid" value={params.sid} />
                <input type="hidden" name="id" value={p.id} />
                <SubmitButton className="text-xs font-medium text-due-ink" confirm="Ye kaam page se hatayein?">Kaam hatayein</SubmitButton>
              </form>
            </details>
          ))}
        </div>
        <form action={saveProject} className="card space-y-4">
          <h3>Naya kaam add karein</h3>
          <input type="hidden" name="sid" value={params.sid} />
          <ProjectFields />
          <SubmitButton>Add karein</SubmitButton>
        </form>
      </section>
    </div>
  );
}
