'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { safePath } from '@/lib/safePath';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { normalizePhone } from '@/lib/phone';
import { LogoMark } from '@/components/Logo';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('next');
  const next = safePath(raw);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get('err'));
  const supabase = createClient();

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = normalizePhone(phone);
    if (!p) return setError('Mobile number sahi likhein, jaise 0300 1234567');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: '+' + p });
    setLoading(false);
    if (error) return setError('Code nahi bheja ja saka: ' + error.message);
    setStep('code');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = normalizePhone(phone)!;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: '+' + p, token: code.trim(), type: 'sms' });
    setLoading(false);
    if (error) return setError('Code ghalat hai ya expire ho gaya. Dobara bhejein.');
    router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 py-4 md:grid-cols-2 md:py-10">
      <div className="hidden md:block">
        <LogoMark className="h-14 w-14" />
        <h1 className="mt-6 text-4xl font-bold leading-tight">Apne mobile number se andar aayein.</h1>
        <p className="mt-4 text-ink-soft">Koi password yaad nahi rakhna. SMS mein 6 digit code aata hai — wahi aap ki pehchan hai.</p>
        <ul className="mt-6 space-y-2 text-sm text-ink-soft">
          <li>Makan malik: apne ghar ka fund status</li>
          <li>Society admin: poori society ka hisaab</li>
          <li>Electrician / plumber: apni profile aur kaam</li>
        </ul>
      </div>

      <div className="panel p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold">{step === 'phone' ? 'Login' : 'Code daalein'}</h2>
        <p className="mb-6 mt-1 text-sm text-ink-mute">
          {step === 'phone' ? 'Hum is number par verification code bhejenge.' : `${phone} par bheja gaya 6 digit code.`}
        </p>
        {step === 'phone' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="label" htmlFor="phone">Mobile number</label>
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-canvas px-3 text-sm font-semibold text-ink-soft">+92</span>
                <input id="phone" className="input rounded-l-none" inputMode="tel" autoComplete="tel" placeholder="300 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} required autoFocus />
              </div>
            </div>
            <button className="btn w-full py-3" disabled={loading}>{loading ? 'Code bhej rahe hain…' : 'Code bhejein'}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <div>
              <label className="label" htmlFor="code">Verification code</label>
              <input id="code" className="input text-center font-display text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus />
            </div>
            <button className="btn w-full py-3" disabled={loading || code.length < 6}>{loading ? 'Check ho raha hai…' : 'Login karein'}</button>
            <button type="button" className="btn-ghost w-full" onClick={() => { setStep('phone'); setCode(''); }}>Number badlein</button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 rounded-lg bg-due-soft px-3 py-2 text-sm text-due">{error}</p>}
        <p className="mt-6 text-xs text-ink-mute">Login kar ke aap hamari <Link href="/privacy">privacy policy</Link> se ittefaq karte hain.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
