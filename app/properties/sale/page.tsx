import Browse, { type BrowseSP } from '@/components/property/Browse';

export const metadata = {
  title: 'Ghar, plot aur flat for sale — society verified',
  description: 'Housing societies mein ghar, plot aur flat khareedein. Demand, size, kaghzat, qabza aur qiston ki maloomat. Seller se seedha call ya WhatsApp.',
  alternates: { canonical: '/properties/sale' },
};

export default function Page({ searchParams }: { searchParams: BrowseSP }) {
  return <Browse deal="sale" sp={searchParams} />;
}
