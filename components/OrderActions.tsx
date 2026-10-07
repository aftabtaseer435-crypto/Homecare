import SubmitButton from './SubmitButton';
import { orderAction } from '@/app/orders/actions';

/** Status buttons for one order, for the customer or the provider side. */
export default function OrderActions({ o, side, next }: { o: { id: string; status: string; amount?: number | null }; side: 'customer' | 'provider'; next: string }) {
  const hidden = (action: string) => (
    <>
      <input type="hidden" name="id" value={o.id} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="next" value={next} />
    </>
  );
  if (o.status === 'cancelled' || (o.status === 'done' && side === 'provider')) return null;
  return (
    <div className="flex flex-wrap items-end gap-2">
      {side === 'provider' && o.status === 'new' && (
        <form action={orderAction}>{hidden('accept')}<SubmitButton className="btn btn-sm bg-service hover:bg-service-ink">Qubool karein</SubmitButton></form>
      )}
      {side === 'provider' && (
        <form action={orderAction} className="flex items-end gap-2">
          {hidden('done')}
          <input name="amount" type="number" min="0" inputMode="numeric" placeholder="Bill Rs" aria-label="Bill (Rs)" className="input w-28 py-1.5 text-sm" />
          <SubmitButton className="btn btn-sm">Mukammal ✓</SubmitButton>
        </form>
      )}
      {side === 'customer' && o.status !== 'done' && (
        <form action={orderAction} className="flex items-end gap-2">
          {hidden('received')}
          <input name="amount" type="number" min="0" inputMode="numeric" placeholder="Kitne diye (Rs)" aria-label="Kitne paise diye" className="input w-36 py-1.5 text-sm" />
          <SubmitButton className="btn btn-sm">Mil gaya / kaam ho gaya ✓</SubmitButton>
        </form>
      )}
      {o.status !== 'done' && (
        <form action={orderAction}>
          {hidden('cancel')}
          <SubmitButton className="btn-ghost btn-sm text-due-ink" confirm="Ye order cancel karein?">Cancel</SubmitButton>
        </form>
      )}
    </div>
  );
}
