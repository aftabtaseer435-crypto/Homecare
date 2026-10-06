import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SocietyHub — society fund, home services, rent / sale';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const plates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const red = new Set([3, 8, 11, 16]);

export default function OgImage() {
  const name = process.env.NEXT_PUBLIC_APP_NAME || 'SocietyHub';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#053527', color: 'white', padding: 64, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 800 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#0B6E4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>⌂</div>
            {name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08 }}>Society ka hisaab aur ghar ke kaam, ek app mein.</div>
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
