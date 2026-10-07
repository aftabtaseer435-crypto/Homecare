import Browse, { type BrowseSP } from '@/components/property/Browse';

export const metadata = {
  title: 'Ghar, portion aur flat for rent — society verified',
  description: 'Housing societies mein ghar, portion, flat aur kamre kiraye par. Kiraya, advance, family / bachelor shartein. Malik se seedha call ya WhatsApp.',
  alternates: { canonical: '/properties/rent' },
};

export default function Page({ searchParams }: { searchParams: BrowseSP }) {
  return <Browse deal="rent" sp={searchParams} />;
}
