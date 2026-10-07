// Look of each notification kind (icon + colour), shared by the bell and the page.
export const notifKind: Record<string, { icon: string; cls: string; label: string }> = {
  order: { icon: '🛍️', cls: 'bg-service-soft', label: 'Order' },
  review: { icon: '⭐', cls: 'bg-amber-50', label: 'Review' },
  notice: { icon: '📢', cls: 'bg-brand-50', label: 'Society notice' },
  welfare: { icon: '🛠️', cls: 'bg-plate-soft', label: 'Welfare' },
  society: { icon: '🏠', cls: 'bg-brand-50', label: 'Society' },
  provider: { icon: '🧰', cls: 'bg-service-soft', label: 'Provider' },
  payment: { icon: '💳', cls: 'bg-paid-soft', label: 'Payment' },
  info: { icon: '🔔', cls: 'bg-canvas', label: 'Update' },
};
export const kindOf = (k: string) => notifKind[k] ?? notifKind.info;

/** Titles from the database start with an emoji; the list shows its own icon. */
export const cleanTitle = (t: string) => t.replace(/^[^\p{L}\p{N}]+/u, '');
