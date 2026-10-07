'use client';

import { useState } from 'react';
import SubmitButton from './SubmitButton';
import { IconStar } from './Icons';
import { submitReview } from '@/app/providers/[id]/actions';

const words = ['', 'Bura', 'Theek nahi', 'Theek', 'Acha', 'Bohat acha'];

/** Big tap-friendly star picker + comment. Used right after an order is completed. */
export default function ReviewForm({ providerId, next, initialStars = 0, initialComment = '', providerName }: { providerId: string; next: string; initialStars?: number; initialComment?: string; providerName?: string }) {
  const [stars, setStars] = useState(initialStars);
  const [hover, setHover] = useState(0);
  const shown = hover || stars;
  return (
    <form action={submitReview} className="space-y-3">
      <input type="hidden" name="provider_id" value={providerId} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="stars" value={stars} />
      <div>
        <div className="text-sm font-semibold text-ink">{providerName ? `${providerName} ka kaam kaisa raha?` : 'Kaam kaisa raha?'}</div>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Stars" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} star`}
              onClick={() => setStars(n)}
              onMouseEnter={() => setHover(n)}
              className={`rounded-lg p-1 transition-transform active:scale-90 ${n <= shown ? 'text-amber-500' : 'text-ink/25'}`}
            >
              <IconStar className="h-9 w-9" filled={n <= shown} />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-ink-soft">{words[shown]}</span>
        </div>
      </div>
      <textarea name="comment" rows={2} maxLength={500} defaultValue={initialComment} className="input" placeholder="Kuch likhna chahein? (optional) — saman taza tha, waqt par aaye..." />
      <SubmitButton className="btn w-full" disabled={!stars}>{initialStars ? 'Review update karein' : 'Review bhejein'}</SubmitButton>
    </form>
  );
}
