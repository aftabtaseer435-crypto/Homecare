// One source of truth for the site's sections. Each module has its own
// colour and its own links so features are never mixed together.

export type Module = 'society' | 'services' | 'property' | 'help';

export const modules: {
  id: Module;
  name: string;
  short: string;
  blurb: string;
  home: string;
  links: { href: string; label: string; auth?: boolean }[];
  match: string[];
}[] = [
  {
    id: 'society',
    name: 'Society',
    short: 'Society',
    blurb: 'Fund, hisaab, welfare masle, WhatsApp reminders',
    home: '/society',
    links: [
      { href: '/society', label: 'Overview' },
      { href: '/welfare', label: 'Masla report', auth: true },
      { href: '/hisaab', label: 'Fund hisaab', auth: true },
      { href: '/societies/join', label: 'Apna ghar', auth: true },
      { href: '/societies/register', label: 'Society register', auth: true },
      { href: '/guides/society-admin', label: 'Admin guide' },
    ],
    match: ['/society', '/societies', '/s/', '/my/houses', '/welfare', '/hisaab', '/w/'],
  },
  {
    id: 'services',
    name: 'Home Services',
    short: 'Services',
    blurb: 'Electrician, plumber, masi — aur chicken, sabzi, rashan, dawai ghar tak',
    home: '/services',
    links: [
      { href: '/services', label: 'Shuru' },
      { href: '/services/find', label: 'Kuch mangwayein' },
      { href: '/my/orders', label: 'Mere orders', auth: true },
      { href: '/provider', label: 'Provider / dukaan', auth: true },
      { href: '/guides/service-provider', label: 'Provider guide' },
    ],
    match: ['/services', '/providers', '/provider', '/my/orders'],
  },
  {
    id: 'property',
    name: 'Rent / Sale',
    short: 'Rent / Sale',
    blurb: 'Society-verified ghar rent aur sale',
    home: '/properties',
    links: [
      { href: '/properties', label: 'Ghar dekhein' },
      { href: '/properties/new', label: 'Ghar list karein', auth: true },
      { href: '/my/listings', label: 'Meri listings', auth: true },
      { href: '/guides/ghar-rent-sale', label: 'Listing guide' },
    ],
    match: ['/properties', '/my/listings'],
  },
  {
    id: 'help',
    name: 'Madad',
    short: 'Guides',
    blurb: 'Har user ke liye step-by-step guides',
    home: '/guides',
    links: [
      { href: '/guides', label: 'Saari guides' },
      { href: '/guides/app-install', label: 'Phone par install' },
      { href: '/privacy', label: 'Privacy' },
    ],
    match: ['/guides'],
  },
];

export function moduleFor(path: string) {
  return modules.find((m) => m.match.some((p) => path === p || path.startsWith(p.endsWith('/') ? p : p + '/') || path === p));
}

/** Tailwind classes per module (kept literal so Tailwind picks them up). */
export const moduleTheme: Record<Module, { bg: string; soft: string; text: string; ring: string; dot: string; border: string }> = {
  society: { bg: 'bg-society', soft: 'bg-society-soft', text: 'text-society-ink', ring: 'ring-society', dot: 'bg-society', border: 'border-society' },
  services: { bg: 'bg-service', soft: 'bg-service-soft', text: 'text-service-ink', ring: 'ring-service', dot: 'bg-service', border: 'border-service' },
  property: { bg: 'bg-property', soft: 'bg-property-soft', text: 'text-property-ink', ring: 'ring-property', dot: 'bg-property', border: 'border-property' },
  help: { bg: 'bg-ink', soft: 'bg-white', text: 'text-ink', ring: 'ring-ink', dot: 'bg-plate', border: 'border-ink' },
};
