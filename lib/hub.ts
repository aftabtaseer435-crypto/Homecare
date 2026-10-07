import { storagePublicUrl } from '@/lib/format';

export const projectCategories = [
  { id: 'lights', label: 'Street lights' },
  { id: 'safai', label: 'Safai' },
  { id: 'roads', label: 'Sarkein' },
  { id: 'water', label: 'Pani' },
  { id: 'sewerage', label: 'Sewerage' },
  { id: 'security', label: 'Security' },
  { id: 'parks', label: 'Park' },
  { id: 'mosque', label: 'Masjid' },
  { id: 'other', label: 'Doosra kaam' },
] as const;
export const projectCategoryLabel = (c: string) => projectCategories.find((x) => x.id === c)?.label ?? 'Kaam';

export const projectStatus: Record<string, { label: string; cls: string }> = {
  in_progress: { label: 'Kaam jari', cls: 'bg-plate-soft text-plate-ink' },
  done: { label: 'Mukammal', cls: 'bg-paid-soft text-paid-ink' },
  planned: { label: 'Agla plan', cls: 'bg-service-soft text-service-ink' },
};

/** Uploaded photo, else the built-in illustration for the category. */
export function projectImage(p: { image_path?: string | null; category: string }) {
  return storagePublicUrl(p.image_path) ?? `/hub/${projectCategories.some((c) => c.id === p.category) ? p.category : 'other'}.svg`;
}

export function bannerImage(s: { banner_path?: string | null }) {
  return storagePublicUrl(s.banner_path) ?? '/hub/banner.svg';
}
