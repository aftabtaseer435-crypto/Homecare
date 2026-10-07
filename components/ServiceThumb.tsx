'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';

/** Real photo for a service category; falls back to the emoji if it can't load. */
export default function ServiceThumb({ src, icon, className = 'h-12 w-12', text = 'text-2xl' }: { src: string | null; icon: string | null; className?: string; text?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className={`flex shrink-0 items-center justify-center rounded-xl bg-canvas ${text} ${className}`} aria-hidden="true">{icon}</span>;
  }
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`shrink-0 rounded-xl bg-canvas object-cover ring-1 ring-line ${className}`} />;
}
