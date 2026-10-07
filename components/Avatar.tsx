/* eslint-disable @next/next/no-img-element */
export default function Avatar({ name, src, size = 44 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const style = { width: size, height: size };
  return src ? (
    <img src={src} alt={name} style={style} className="shrink-0 rounded-full object-cover ring-2 ring-white shadow-soft" />
  ) : (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-200" aria-hidden="true">
      {initials}
    </span>
  );
}
