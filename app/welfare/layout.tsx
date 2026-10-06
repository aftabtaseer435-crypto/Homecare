import { noindex } from '@/lib/seo';

export const metadata = { ...noindex, title: 'Welfare — masle aur hal' };

export default function WelfareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
