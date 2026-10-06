'use client';

import { useEffect } from 'react';

/** Opens WhatsApp once right after a masla is reported (true one-click flow). */
export default function AutoWhatsApp({ href, onceKey }: { href: string; onceKey: string }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(onceKey)) return;
      sessionStorage.setItem(onceKey, '1');
    } catch {
      /* storage blocked — still open once per page load */
    }
    const t = setTimeout(() => {
      window.location.href = href;
    }, 600);
    return () => clearTimeout(t);
  }, [href, onceKey]);
  return null;
}
