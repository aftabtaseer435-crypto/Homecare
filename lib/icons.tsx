// One place for app icons (lucide line icons) — no emoji "stickers" in the UI.
import {
  Bell, Briefcase, Brush, Bug, Bus, Car, CarTaxiFront, Cctv, ChefHat, Carrot, Croissant, CreditCard, Cylinder, Drumstick, Droplet,
  Droplets, FileText, Flame, GraduationCap, Hammer, House, Lightbulb, Megaphone, Milk, Paintbrush, Pill, Scale, Scissors, Shield,
  ShieldCheck, Shirt, ShoppingBag, ShoppingCart, Snowflake, Sparkles, SprayCan, Sprout, Star, Store, Sun, Trash2, Truck,
  UtensilsCrossed, WashingMachine, Waves, Wrench, Zap, BrickWall, Construction, KeyRound, type LucideIcon,
} from 'lucide-react';

const service: Record<string, LucideIcon> = {
  electrician: Zap, plumber: Wrench, carpenter: Hammer, painter: Paintbrush, 'ac-repair': Snowflake,
  'appliance-repair': WashingMachine, mason: BrickWall, welder: Flame, solar: Sun, 'cctv-internet': Cctv,
  maid: Sparkles, cook: ChefHat, driver: Car, gardener: Sprout, guard: ShieldCheck,
  rickshaw: CarTaxiFront, loader: Truck, 'school-van': Bus,
  'deep-cleaning': SprayCan, 'tank-cleaning': Droplets, 'pest-control': Bug, sewerage: Waves,
  tailor: Scissors, laundry: Shirt, tutor: GraduationCap, beautician: Brush,
  'chicken-meat': Drumstick, 'sabzi-fruit': Carrot, rashan: ShoppingCart, medicine: Pill, bakery: Croissant,
  'night-food': UtensilsCrossed, milk: Milk, 'water-cans': Droplet, 'gas-cylinder': Cylinder,
};
export const serviceIcon = (slug?: string | null): LucideIcon => (slug && service[slug]) || Store;

const welfare: Record<string, LucideIcon> = {
  street_light: Lightbulb, water: Droplets, sewerage: Waves, road: Construction, cleanliness: Trash2,
  security: Shield, legal: Scale, other: FileText,
};
export const welfareIcon = (id?: string | null): LucideIcon => (id && welfare[id]) || FileText;

const notif: Record<string, LucideIcon> = {
  order: ShoppingBag, review: Star, notice: Megaphone, welfare: Wrench, society: House,
  provider: Briefcase, payment: CreditCard, property: KeyRound, info: Bell,
};
export const notifIcon = (kind?: string | null): LucideIcon => (kind && notif[kind]) || Bell;
