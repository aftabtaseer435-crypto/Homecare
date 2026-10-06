import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { deleteAccount } from './actions';

export const metadata = { title: 'Account delete' };

export default async function DeleteAccount({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requireUser('/account/delete');
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Account delete karein" />
      <Flash searchParams={searchParams} />
      <form action={deleteAccount} className="card space-y-4 text-sm">
        <p>Account delete karne se yeh hamesha ke liye hat jayega:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Aap ka login aur profile</li>
          <li>Provider profile, reviews aur CNIC images</li>
          <li>Aap ki property listings aur photos</li>
        </ul>
        <p className="muted">Society ke fund dues / payment records society ke hisaab ke liye reh sakte hain (aap ke naam ke bina login ke).</p>
        <div>
          <label className="label">Confirm karne ke liye DELETE likhein</label>
          <input name="confirm" className="input" required autoComplete="off" />
        </div>
        <SubmitButton className="btn-danger" confirm="Pakka? Yeh wapas nahi hoga.">Account hamesha ke liye delete karein</SubmitButton>
      </form>
    </div>
  );
}
