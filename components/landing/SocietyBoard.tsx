/**
 * Hero visual: one gali of a society as the admin sees it —
 * every house a number plate, green = jama, red = baqi.
 * Plates "settle" in one short staggered sequence on load.
 */
const unpaid = new Set([3, 8, 11, 16, 19, 22]);
const partial = new Set([14]);

export default function SocietyBoard() {
  const houses = Array.from({ length: 24 }, (_, i) => i + 1);
  const paid = houses.length - unpaid.size - partial.size;
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="panel relative z-10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-lg font-bold">Gali 7, Block C</div>
            <div className="text-sm text-ink-mute">Development Fund · October</div>
          </div>
          <div className="rounded-xl bg-canvas px-3 py-2 text-right">
            <div className="font-display text-xl font-bold leading-none text-paid-ink">{paid}/24</div>
            <div className="mt-1 text-[11px] font-semibold text-ink-mute">ghar jama</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-6 gap-2" role="img" aria-label={`${paid} ghar ka fund jama, ${unpaid.size} baqi`}>
          {houses.map((n, i) => {
            const cls = unpaid.has(n) ? 'plate-due' : partial.has(n) ? 'plate-partial' : 'plate-paid';
            return (
              <span
                key={n}
                className={`plate ${cls} h-9 w-full animate-[plateIn_.45s_ease-out_both] text-sm`}
                style={{ animationDelay: `${120 + i * 35}ms` }}
              >
                {n}
              </span>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-ink-soft">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-paid" /> Jama</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-due" /> Baqi</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-part" /> Aadha</span>
        </div>
      </div>

      {/* WhatsApp reminder that goes out for a red house */}
      <div className="relative z-20 -mt-6 ml-auto mr-0 w-[88%] max-w-xs animate-[bubbleIn_.5s_ease-out_1.1s_both] rounded-2xl rounded-tr-sm bg-[#DCF8C6] p-3.5 text-[13px] leading-snug text-[#1F2C26] shadow-lift sm:mr-[-1.5rem]">
        <div className="mb-1 text-[11px] font-bold text-[#128C7E]">Society Office</div>
        Assalam o Alaikum Ahmed sahab, Gali 7 Ghar 8 ka Development Fund Rs 2,000 — 10 Oct tak jama karwana hai. Shukriya.
        <div className="mt-1 text-right text-[10px] text-[#667781]">9:41 ✓✓</div>
      </div>
    </div>
  );
}
