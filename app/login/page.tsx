'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { normalizePhone } from '@/lib/phone';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = normalizePhone(phone);
    if (!p) return setError('Sahi mobile number likhein, jaise 03001234567');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: '+' + p });
    setLoading(false);
    if (error) return setError(error.message);
    setStep('code');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = normalizePhone(phone)!;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: '+' + p, token: code.trim(), type: 'sms' });
    setLoading(false);
    if (error) return setError('Code ghalat hai ya expire ho gaya: ' + error.message);
    router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="mb-1">Login</h1>
        <p className="muted mb-5">Mobile number par verification code aayega. Password ki zaroorat nahi.</p>
        {step === 'phone' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="label">Mobile number</label>
              <input className="input" inputMode="tel" placeholder="0300 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <button className="btn w-full" disabled={loading}>{loading ? 'Bhej rahe hain…' : 'Code bhejein'}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <div>
              <label className="label">6 digit code</label>
              <input className="input text-center text-lg tracking-widest" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
            </div>
            <button className="btn w-full" disabled={loading}>{loading ? 'Check ho raha hai…' : 'Verify & Login'}</button>
            <button type="button" className="w-full text-sm text-gray-500" onClick={() => setStep('phone')}>Number badlein</button>
          </form>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
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
