'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import { serviceIcon } from '@/lib/icons';

/**
 * Real photo for a service category. The line icon shows first and stays if
 * the photo is slow or can't load; the photo fades in once it has loaded.
 */
export default function ServiceThumb({ src, slug, className = 'h-12 w-12' }: { src: string | null; slug?: string | null; className?: string; icon?: string | null; text?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // the image may have finished before React attached its handlers
    const el = img.current;
    if (el?.complete) el.naturalWidth > 0 ? setLoaded(true) : setFailed(true);
  }, [src]);
  const I = serviceIcon(slug);
  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-service-soft text-service-ink ${className}`} aria-hidden="true">
      <I className="h-1/2 w-1/2" strokeWidth={1.75} />
      {src && !failed && (
        <img
          ref={img}
          src={src}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  );
}
