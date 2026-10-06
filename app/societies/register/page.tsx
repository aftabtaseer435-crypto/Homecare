import { requireUser } from '@/lib/auth';
import { Flash, PageHeader } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { submitSocietyRequest } from './actions';
import { displayPhone } from '@/lib/phone';

export const metadata = { title: 'Society free register karein — development fund app', description: 'Apni housing society ko free register karein: ghar ka record, fund ka green / red status aur WhatsApp reminders.', alternates: { canonical: '/societies/register' } };

export default async function RegisterSociety({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { profile } = await requireUser('/societies/register');
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Apni society register karein — Free" subtitle="Request bhejein. Hamari team call kar ke verify karegi, phir admin panel aap ko mil jayega." />
      <Flash searchParams={searchParams} />
      <form action={submitSocietyRequest} className="card grid gap-4 md:grid-cols-2">
        <Field name="society_name" label="Society ka naam *" required />
        <Field name="city" label="City *" required />
        <div className="md:col-span-2"><Field name="address" label="Poora address *" required /></div>
        <Field name="map_url" label="Google Maps link" />
        <Field name="total_houses" label="Total ghar (andaza)" type="number" />
        <Field name="president_name" label="President / committee head ka naam" />
        <Field name="registration_no" label="Society registration no. (agar hai)" />
        <Field name="admin_name" label="Admin ka naam *" required defaultValue={profile.full_name ?? ''} />
        <Field name="admin_phone" label="Admin mobile *" required defaultValue={displayPhone(profile.phone)} />
        <Field name="email" label="Email" type="email" />
        <div className="md:col-span-2">
          <label className="label">Kuch aur batana ho</label>
          <textarea name="notes" className="input" rows={3} />
        </div>
        <div className="md:col-span-2">
          <SubmitButton>Request bhejein</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Field(props: { name: string; label: string; required?: boolean; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="label">{props.label}</label>
      <input name={props.name} type={props.type ?? 'text'} required={props.required} defaultValue={props.defaultValue} className="input" />
    </div>
  );
}
