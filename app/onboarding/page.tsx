import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { saveName } from './actions';
import SubmitButton from '@/components/SubmitButton';
import { displayPhone } from '@/lib/phone';

export default async function Onboarding({ searchParams }: { searchParams: { next?: string } }) {
  const { user, profile } = await getSession();
  const next = searchParams.next && searchParams.next.startsWith('/') ? searchParams.next : '/dashboard';
  if (!user) redirect('/login');
  if (profile?.full_name) redirect(next);

  return (
    <div className="mx-auto max-w-sm">
      <form action={saveName} className="card space-y-4">
        <h1>Khush aamdeed!</h1>
        <p className="muted">Number verified: {displayPhone(profile?.phone)}. Apna naam likhein.</p>
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label">Poora naam</label>
          <input name="full_name" className="input" required minLength={2} />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="whatsapp_opt_in" defaultChecked className="mt-1" />
          Main WhatsApp par fund reminders, receipts aur society notices lena chahta hoon.
        </label>
        <SubmitButton className="btn w-full">Continue</SubmitButton>
      </form>
    </div>
  );
}
