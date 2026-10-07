-- =====================================================================
-- 0007  Daily household delivery + provider working hours
--  * New service group "Rozmarra saman": chicken, sabzi, rashan, dawai,
--    bakery, raat ka khana, doodh, pani, gas cylinder
--  * providers: din aur raat ke auqaat (kab se kab tak service)
--  * Super admin ka naam: Touseef
-- Run after 0006. Safe to run more than once.
-- =====================================================================

alter table public.providers add column if not exists day_start time;
alter table public.providers add column if not exists day_end time;
alter table public.providers add column if not exists night_start time;
alter table public.providers add column if not exists night_end time;

insert into public.service_categories (slug, name, name_ur, grp, icon, sort) values
  ('chicken-meat', 'Chicken / Gosht',       'چکن / گوشت',       'Rozmarra saman (ghar tak)', '🍗', 1),
  ('sabzi-fruit',  'Sabzi / Fruit',         'سبزی / فروٹ',      'Rozmarra saman (ghar tak)', '🥬', 2),
  ('rashan',       'Rashan / Kiryana',      'راشن / کریانہ',    'Rozmarra saman (ghar tak)', '🛒', 3),
  ('medicine',     'Medicine / Pharmacy',   'دوائی',            'Rozmarra saman (ghar tak)', '💊', 4),
  ('bakery',       'Bakery ka saman',       'بیکری',            'Rozmarra saman (ghar tak)', '🥖', 5),
  ('night-food',   'Raat ka khana',         'رات کا کھانا',     'Rozmarra saman (ghar tak)', '🍛', 6),
  ('milk',         'Doodh / Dahi',          'دودھ / دہی',       'Rozmarra saman (ghar tak)', '🥛', 7),
  ('water-cans',   'Mineral water',         'پانی کی بوتل',     'Rozmarra saman (ghar tak)', '💧', 8),
  ('gas-cylinder', 'Gas cylinder',          'گیس سلنڈر',        'Rozmarra saman (ghar tak)', '🔥', 9)
on conflict (slug) do nothing;

update public.profiles set full_name = 'Touseef' where is_super_admin;
