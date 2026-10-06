import Link from 'next/link';

/** Brand mark: a house on the society's yellow number-plate. */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#0B6E4F" />
      <path d="M9 20.5 20 11l11 9.5V30a1.5 1.5 0 0 1-1.5 1.5h-6v-7h-7v7h-6A1.5 1.5 0 0 1 9 30z" fill="#fff" />
      <rect x="16" y="26.5" width="8" height="5" rx="1.2" fill="#F4B400" stroke="#0F1F19" strokeWidth="1" />
    </svg>
  );
}

export default function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink no-underline hover:no-underline" aria-label={`${name} home`}>
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight sm:text-xl">{name}</span>
    </Link>
  );
}
