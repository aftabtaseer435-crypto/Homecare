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

/**
 * Order sound (our own, synthesised): a cash-register "cha-ching" — noise
 * "cha" + bright metallic bell with coin shimmer — followed by a quick
 * two-note marimba "ding-ding". ~1.7 s, loud but clean.
 */
function burst(volume = 1) {
  if (!ctx || ctx.state !== 'running') return;
  const c = ctx;
  const t0 = c.currentTime + 0.02;
  const out = c.createDynamicsCompressor();
  out.threshold.value = -10;
  out.ratio.value = 4;
  const master = c.createGain();
  master.gain.value = 0.85 * volume;
  out.connect(master).connect(c.destination);

  // "cha": short bright noise hit
  const len = Math.floor(c.sampleRate * 0.09);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = c.createBufferSource();
  noise.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 4200;
  bp.Q.value = 0.8;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.9, t0);
  ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
  noise.connect(bp).connect(ng).connect(out);
  noise.start(t0);

  // "ching": inharmonic bell partials
  const bellAt = t0 + 0.11;
  [[2093, 0.55, 1.1], [2637, 0.35, 0.9], [3520, 0.28, 0.7], [5274, 0.18, 0.45], [6272, 0.12, 0.3]].forEach(([f, g, dur]) => {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    og.gain.setValueAtTime(0.0001, bellAt);
    og.gain.exponentialRampToValueAtTime(g, bellAt + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, bellAt + dur);
    o.connect(og).connect(out);
    o.start(bellAt);
    o.stop(bellAt + dur + 0.05);
  });
  // coin shimmer
  for (let i = 0; i < 5; i++) {
    const at = bellAt + 0.04 + i * 0.045;
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = 'triangle';
    o.frequency.value = 5800 + ((i * 937) % 1800);
    og.gain.setValueAtTime(0.0001, at);
    og.gain.exponentialRampToValueAtTime(0.12, at + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
    o.connect(og).connect(out);
    o.start(at);
    o.stop(at + 0.1);
  }

  // "ding-ding": warm marimba-like notes, rising
  [[1318.5, 0.85], [1975.5, 1.05]].forEach(([f, at], i) => {
    const start = t0 + at;
    [1, 3.01].forEach((mult, k) => {
      const o = c.createOscillator();
      const og = c.createGain();
      o.type = k ? 'sine' : 'triangle';
      o.frequency.value = f * mult;
      const peak = (k ? 0.12 : 0.6) * (i ? 1 : 0.85);
      og.gain.setValueAtTime(0.0001, start);
      og.gain.exponentialRampToValueAtTime(peak, start + 0.006);
      og.gain.exponentialRampToValueAtTime(0.0001, start + (k ? 0.15 : 0.55));
      o.connect(og).connect(out);
      o.start(start);
      o.stop(start + 0.6);
    });
  });
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

/** Ring until stopAlarm(): order sound every 3 s + vibration. */
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
