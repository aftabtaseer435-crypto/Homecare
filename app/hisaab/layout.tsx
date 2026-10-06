import { noindex } from '@/lib/seo';

export const metadata = { ...noindex, title: 'Fund ka hisaab' };

export default function HisaabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
