import 'server-only';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

export type PushPayload = { title: string; body: string; url: string; tag?: string; kind?: 'order' | 'update' };

export const pushEnabled = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@housingwelfare.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

/** Send to every device of a user. Dead subscriptions are removed. Never throws. */
export async function pushToUser(userId: string, payload: PushPayload) {
  if (!pushEnabled() || !userId) return 0;
  try {
    configure();
    const admin = createAdminClient();
    const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId);
    let sent = 0;
    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
            { TTL: 60 * 60, urgency: 'high', topic: payload.tag?.slice(0, 32).replace(/[^A-Za-z0-9_-]/g, '') || undefined },
          );
          sent++;
          await admin.from('push_subscriptions').update({ last_ok_at: new Date().toISOString() }).eq('id', s.id);
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from('push_subscriptions').delete().eq('id', s.id);
          else console.error('push failed', e?.statusCode, e?.body);
        }
      }),
    );
    return sent;
  } catch (e) {
    console.error('pushToUser', e);
    return 0;
  }
}
