// Look of each notification kind (colour + label); icons come from lib/icons.
export const notifKind: Record<string, { cls: string; label: string }> = {
  order: { cls: 'bg-service-soft text-service-ink', label: 'Order' },
  review: { cls: 'bg-amber-50 text-amber-600', label: 'Review' },
  notice: { cls: 'bg-brand-50 text-brand-700', label: 'Society notice' },
  welfare: { cls: 'bg-plate-soft text-plate-ink', label: 'Welfare' },
  society: { cls: 'bg-brand-50 text-brand-700', label: 'Society' },
  provider: { cls: 'bg-service-soft text-service-ink', label: 'Provider' },
  payment: { cls: 'bg-paid-soft text-paid-ink', label: 'Payment' },
  property: { cls: 'bg-property-soft text-property-ink', label: 'Property' },
  info: { cls: 'bg-canvas text-ink-soft', label: 'Update' },
};
export const kindOf = (k: string) => notifKind[k] ?? notifKind.info;

/** Titles from the database start with an emoji; the list shows its own icon. */
export const cleanTitle = (t: string) => t.replace(/^[^\p{L}\p{N}]+/u, '');
