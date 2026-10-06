import 'server-only';

export type SendResult = { ok: boolean; id?: string; error?: string; dryRun?: boolean };

/**
 * Send an approved WhatsApp template message through Meta's Cloud API.
 * If WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not set the call is a
 * dry run (logged, not sent) so the rest of the system can be tested.
 */
export async function sendTemplate(
  to: string,
  template: string,
  params: string[],
  lang = process.env.WHATSAPP_TEMPLATE_LANG || 'en',
): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneId) {
    console.log(`[whatsapp dry-run] to=${to} template=${template} params=${JSON.stringify(params)}`);
    return { ok: true, dryRun: true };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: lang },
          components: params.length
            ? [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }]
            : [],
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: JSON.stringify(data?.error ?? data).slice(0, 500) };
    return { ok: true, id: data?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const templates = {
  reminder: () => process.env.WHATSAPP_TEMPLATE_REMINDER || 'fund_reminder',
  overdue: () => process.env.WHATSAPP_TEMPLATE_OVERDUE || 'fund_overdue',
  receipt: () => process.env.WHATSAPP_TEMPLATE_RECEIPT || 'payment_receipt',
  notice: () => process.env.WHATSAPP_TEMPLATE_NOTICE || 'society_notice',
};
