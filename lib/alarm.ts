'use client';

// Loud order alarm built with the Web Audio API (no sound file needed).
// Browsers only allow sound after the user has tapped the page once, so
// unlockAudio() is called on the first tap anywhere.

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

export function audioReady() {
  return !!ctx && ctx.state === 'running';
}

export async function unlockAudio() {
  try {
    if (!ctx) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!AC) return false;
      ctx = new AC();
    }
    if (ctx.state !== 'running') await ctx.resume();
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

/** One burst: a loud two-tone siren, ~1.6 s. */
function burst(volume = 1) {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -6;
  comp.connect(ctx.destination);
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(comp);
  for (let i = 0; i < 8; i++) {
    const t = now + i * 0.2;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(i % 2 ? 740 : 1100, t);
    o.connect(gain);
    o.start(t);
    o.stop(t + 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.9 * volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  }
}

/** Soft two-note chime for status updates. */
export function chime() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  [880, 1320].forEach((f, i) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now + i * 0.18);
    g.gain.exponentialRampToValueAtTime(0.5, now + i * 0.18 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.5);
    o.connect(g).connect(ctx!.destination);
    o.start(now + i * 0.18);
    o.stop(now + i * 0.18 + 0.55);
  });
}

/** Ring until stopAlarm(): siren every 3 s + vibration. */
export function startAlarm() {
  if (timer) return;
  const ring = () => {
    burst();
    try { if ((navigator as any).userActivation?.hasBeenActive !== false) navigator.vibrate?.([600, 200, 600, 200, 600]); } catch { /* ignore */ }
  };
  ring();
  timer = setInterval(ring, 3000);
}

export function stopAlarm() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  try { navigator.vibrate?.(0); } catch { /* ignore */ }
}

export function speak(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN';
    u.rate = 0.95;
    u.volume = 1;
    s.speak(u);
  } catch {
    /* ignore */
  }
}
