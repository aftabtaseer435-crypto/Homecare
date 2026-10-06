import { noindex } from '@/lib/seo';

export const metadata = noindex;

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
