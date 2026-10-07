'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { serviceIcon } from '@/lib/icons';

/** Real photo for a service category; the line icon shows only if the photo can't load. */
export default function ServiceThumb({ src, slug, className = 'h-12 w-12' }: { src: string | null; slug?: string | null; className?: string; icon?: string | null; text?: string }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // an error before hydration has no handler attached yet
    const el = img.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) {
    const I = serviceIcon(slug);
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-xl bg-service-soft text-service-ink ${className}`} aria-hidden="true">
        <I className="h-1/2 w-1/2" strokeWidth={1.75} />
      </span>
    );
  }
  return <img ref={img} src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`shrink-0 rounded-xl bg-canvas object-cover ring-1 ring-line ${className}`} />;
}
