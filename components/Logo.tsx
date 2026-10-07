import Link from 'next/link';

/** Brand mark: a house sheltering a heart — housing + welfare. */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hw-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1F9A70" />
          <stop offset="1" stopColor="#0F654A" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#hw-g)" />
      <path d="M9.5 19.2 20 10.4l10.5 8.8v10.3a2 2 0 0 1-2 2h-17a2 2 0 0 1-2-2z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 28.2c-3.7-2.5-5.6-4.4-5.6-6.5a2.7 2.7 0 0 1 5.6-1.4 2.7 2.7 0 0 1 5.6 1.4c0 2.1-1.9 4-5.6 6.5z" fill="#FFD45E" />
    </svg>
  );
}

export default function Logo({ name }: { name: string }) {
  const [first, ...rest] = name.split(' ');
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink no-underline hover:no-underline" aria-label={`${name} home`}>
      <LogoMark />
      <span className="text-[17px] font-bold tracking-[-0.02em] sm:text-xl">
        {first}
        {rest.length > 0 && <span className="text-brand-700"> {rest.join(' ')}</span>}
      </span>
    </Link>
  );
}
