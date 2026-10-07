import { hadithOfTheDay } from '@/lib/hadith';

/**
 * Daily hadith strip above the header. One hadith per Pakistan calendar day,
 * cycling through 200. Scrolls gently (right-to-left reading direction);
 * pauses on hover/focus; static and wrapped when reduced motion is on.
 */
export default function HadithBar() {
  const h = hadithOfTheDay();
  const ref = `${h.source}: ${h.number.toLocaleString('en-US', { useGrouping: false })}`;
  const line = (
    <span className="inline-flex items-center gap-3 px-8">
      <span className="font-urdu text-[15px] leading-[2.7] md:text-base">
        رسول اللہ ﷺ نے فرمایا: {h.text}
      </span>
      <span className="whitespace-nowrap font-urdu text-[13px] text-brand-700">({ref})</span>
    </span>
  );
  return (
    <aside aria-label="آج کی حدیث" className="relative z-40 border-b border-brand-100 bg-brand-50 text-brand-900" lang="ur" dir="rtl">
      <div className="container-app flex items-center gap-3 py-1">
        <span className="hidden shrink-0 rounded-md bg-white px-2 py-0.5 font-urdu text-xs font-semibold leading-[2] text-brand-800 ring-1 ring-inset ring-brand-200 sm:inline-block">
          آج کی حدیث
        </span>
        <div className="group relative min-w-0 flex-1 overflow-hidden py-0.5" tabIndex={0}>
          <p className="sr-only">رسول اللہ ﷺ نے فرمایا: {h.text} ({ref})</p>
          {/* Moving copy (decorative duplicate for a seamless loop) */}
          <div className="hadith-track flex w-max whitespace-nowrap motion-safe:animate-[ticker_70s_linear_infinite] group-hover:[animation-play-state:paused] group-focus:[animation-play-state:paused]" aria-hidden="true">
            {line}
            {line}
          </div>
        </div>
      </div>
    </aside>
  );
}
