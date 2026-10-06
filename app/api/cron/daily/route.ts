import { NextResponse, type NextRequest } from 'next/server';
import { runDailyJob } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Called by Vercel Cron every day (see vercel.json). Protected by CRON_SECRET.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const summary = await runDailyJob();
  return NextResponse.json({ ok: true, ...summary });
}
