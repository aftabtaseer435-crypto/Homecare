'use client';

import { logContact } from '@/app/providers/[id]/actions';
import { IconPhone, IconWhatsApp } from './Icons';

/**
 * "Call now" / "WhatsApp now" — the number itself is never shown.
 * Each tap is logged (provider's monthly calls / WhatsApp, review eligibility).
 * `bare` returns just the two buttons so a parent grid can size them equally.
 */
export default function ContactButtons({
  phone,
  whatsapp,
  providerId,
  listingId,
  wantId,
  message,
  compact,
  bare,
}: {
  phone: string;
  whatsapp?: string | null;
  providerId?: string;
  listingId?: string;
  wantId?: string;
  message?: string;
  compact?: boolean;
  bare?: boolean;
}) {
  const wa = whatsapp || phone;
  const size = compact ? 'h-10 text-[13px]' : 'h-11 text-sm';
  const track = (kind: 'call' | 'whatsapp') => {
    logContact({ providerId, listingId, wantId, kind }).catch(() => {});
  };
  const buttons = (
    <>
      <a href={`tel:+${phone}`} onClick={() => track('call')} className={`inline-flex ${size} items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 font-semibold text-brand-800 no-underline transition-colors hover:bg-brand-100 hover:no-underline`}>
        <IconPhone className="h-4 w-4" /> Call now
      </a>
      <a
        href={`https://wa.me/${wa}${message ? `?text=${encodeURIComponent(message)}` : ''}`}
        target="_blank"
        rel="noopener"
        onClick={() => track('whatsapp')}
        className={`inline-flex ${size} items-center justify-center gap-1.5 rounded-xl bg-wa px-3 font-semibold text-white no-underline transition-colors hover:bg-wa-hover hover:no-underline`}
      >
        <IconWhatsApp className="h-4 w-4" /> WhatsApp now
      </a>
    </>
  );
  if (bare) return buttons;
  return <div className="grid grid-cols-2 gap-2">{buttons}</div>;
}
