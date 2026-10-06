'use client';

import { logContact } from '@/app/providers/[id]/actions';

/**
 * Call / WhatsApp buttons. Each click is logged (for provider leads,
 * review eligibility and later billing) then opens the dialer / WhatsApp.
 */
export default function ContactButtons({
  phone,
  whatsapp,
  providerId,
  listingId,
  message,
  compact,
}: {
  phone: string;
  whatsapp?: string | null;
  providerId?: string;
  listingId?: string;
  message?: string;
  compact?: boolean;
}) {
  const wa = whatsapp || phone;
  const cls = compact ? 'btn-sm' : '';
  const track = (kind: 'call' | 'whatsapp') => {
    logContact({ providerId, listingId, kind }).catch(() => {});
  };
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`tel:+${phone}`} onClick={() => track('call')} className={`btn ${cls}`}>📞 Call</a>
      <a
        href={`https://wa.me/${wa}${message ? `?text=${encodeURIComponent(message)}` : ''}`}
        target="_blank"
        rel="noopener"
        onClick={() => track('whatsapp')}
        className={`btn bg-[#1FAF54] hover:bg-[#178F44] ${cls}`}
      >
        WhatsApp
      </a>
    </div>
  );
}
