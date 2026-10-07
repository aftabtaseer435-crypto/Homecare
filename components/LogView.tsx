'use client';

import { useEffect } from 'react';
import { logContact } from '@/app/providers/[id]/actions';

/** Counts one profile view per visitor session (shown to the provider as "Profile views"). */
export default function LogView({ providerId }: { providerId: string }) {
  useEffect(() => {
    const k = `pv-${providerId}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {
      /* ignore */
    }
    logContact({ providerId, kind: 'view' }).catch(() => {});
  }, [providerId]);
  return null;
}
