'use client';

import { useState } from 'react';

/**
 * Opens WhatsApp with a pre-filled message (admin's own WhatsApp — no Meta API).
 * Optionally records the click so the admin can see who was already messaged.
 */
export default function WaButton({
  href,
  label = 'WhatsApp',
  onSent,
  sentLabel,
  small = true,
}: {
  href: string;
  label?: string;
  onSent?: () => Promise<void>;
  sentLabel?: string | null;
  small?: boolean;
}) {
  const [done, setDone] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => {
        setDone(true);
        onSent?.().catch(() => {});
      }}
      className={`btn ${small ? 'btn-sm' : ''} ${done || sentLabel ? 'bg-line text-ink-soft hover:bg-line' : 'bg-[#1FAF54] hover:bg-[#178F44]'}`}
    >
      {done ? '✓ Bhej diya' : sentLabel ?? label}
    </a>
  );
}
