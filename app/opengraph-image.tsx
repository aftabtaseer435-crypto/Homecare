import { appName } from '@/lib/seo';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Housing Welfare — society fund, welfare, home services, rent / sale';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const plates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const red = new Set([3, 8, 11, 16]);

export default function OgImage() {
  const name = appName;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0C4F3A', color: 'white', padding: 64, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 800 }}>
            <svg width="60" height="60" viewBox="0 0 40 40">
              <rect x="1" y="1" width="38" height="38" rx="11" fill="#1F9A70" />
              <path d="M9.5 19.2 20 10.4l10.5 8.8v10.3a2 2 0 0 1-2 2h-17a2 2 0 0 1-2-2z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
              <path d="M20 28.2c-3.7-2.5-5.6-4.4-5.6-6.5a2.7 2.7 0 0 1 5.6-1.4 2.7 2.7 0 0 1 5.6 1.4c0 2.1-1.9 4-5.6 6.5z" fill="#FFD45E" />
            </svg>
            {name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08 }}>Society ka hisaab, welfare aur ghar ke kaam — ek app mein.</div>
            <div style={{ fontSize: 28, marginTop: 20, color: 'rgba(255,255,255,0.85)' }}>Fund green / red · WhatsApp reminders · Electrician, plumber · Rent / sale</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 400, gap: 14, alignContent: 'center', marginLeft: 40 }}>
          {plates.map((n) => (
            <div key={n} style={{ width: 110, height: 64, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, background: red.has(n) ? '#C62828' : '#15803D' }}>{n}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
