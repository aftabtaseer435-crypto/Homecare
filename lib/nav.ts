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
    name: 'Society Fund',
    short: 'Society',
    blurb: 'Development fund, green / red status, WhatsApp reminders',
    home: '/society',
    links: [
      { href: '/society', label: 'Overview' },
      { href: '/societies/join', label: 'Apna ghar add karein', auth: true },
      { href: '/societies/register', label: 'Society register karein', auth: true },
      { href: '/guides/society-admin', label: 'Admin guide' },
    ],
    match: ['/society', '/societies', '/s/', '/my/houses'],
  },
  {
    id: 'services',
    name: 'Home Services',
    short: 'Services',
    blurb: 'Electrician, plumber, masi, rickshaw — verified log',
    home: '/services',
    links: [
      { href: '/services', label: 'Service dhoondein' },
      { href: '/provider/register', label: 'Provider banein', auth: true },
      { href: '/provider/dashboard', label: 'Provider dashboard', auth: true },
      { href: '/guides/service-provider', label: 'Provider guide' },
    ],
    match: ['/services', '/providers', '/provider'],
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
export const moduleTheme: Record<Module, { bg: string; soft: string; text: string; ring: string; dot: string }> = {
  society: { bg: 'bg-society', soft: 'bg-society-soft', text: 'text-society-ink', ring: 'ring-society', dot: 'bg-society' },
  services: { bg: 'bg-service', soft: 'bg-service-soft', text: 'text-service-ink', ring: 'ring-service', dot: 'bg-service' },
  property: { bg: 'bg-property', soft: 'bg-property-soft', text: 'text-property-ink', ring: 'ring-property', dot: 'bg-property' },
  help: { bg: 'bg-ink', soft: 'bg-white', text: 'text-ink', ring: 'ring-ink', dot: 'bg-plate' },
};
