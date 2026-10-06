import { requireSuperAdmin } from '@/lib/auth';
import { Flash } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { saveCategory, toggleCategory } from '../actions';

export default async function AdminCategories({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { supabase } = await requireSuperAdmin();
  const { data: cats } = await supabase.from('service_categories').select('*').order('sort');
  return (
    <div className="space-y-6">
      <Flash searchParams={searchParams} />
      <form action={saveCategory} className="card grid gap-3 md:grid-cols-6">
        <h2 className="md:col-span-6">Category add / update (same slug = update)</h2>
        <div><label className="label">Name *</label><input name="name" className="input" required /></div>
        <div><label className="label">Slug</label><input name="slug" className="input" placeholder="auto" /></div>
        <div><label className="label">Urdu</label><input name="name_ur" className="input" dir="rtl" /></div>
        <div><label className="label">Group</label><input name="grp" className="input" placeholder="Repair & Maintenance" /></div>
        <div><label className="label">Icon (emoji)</label><input name="icon" className="input" /></div>
        <div><label className="label">Sort</label><input name="sort" type="number" className="input" defaultValue={500} /></div>
        <div className="md:col-span-6"><SubmitButton>Save</SubmitButton></div>
      </form>
      <div className="card">
        <table className="table">
          <thead><tr><th></th><th>Name</th><th>Slug</th><th>Group</th><th>Sort</th><th></th></tr></thead>
          <tbody>
            {(cats ?? []).map((c) => (
              <tr key={c.id} className={c.active ? '' : 'opacity-50'}>
                <td>{c.icon}</td><td>{c.name} <span className="text-ink-mute" dir="rtl">{c.name_ur}</span></td><td>{c.slug}</td><td>{c.grp}</td><td>{c.sort}</td>
                <td>
                  <form action={toggleCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={(!c.active).toString()} />
                    <SubmitButton className="btn-outline btn-sm">{c.active ? 'Hide' : 'Show'}</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
