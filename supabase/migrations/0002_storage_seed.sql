-- =====================================================================
-- Storage buckets + service category seed
-- =====================================================================

-- public-media: provider photos, property photos (publicly readable)
-- private-docs: CNIC images, payment proofs (read only via signed URLs from the server)
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true), ('private-docs', 'private-docs', false)
on conflict (id) do nothing;

-- Users may upload only inside a folder named after their own user id: <uid>/...
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('public-media','private-docs')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media update own folder" on storage.objects for update to authenticated
  using (bucket_id in ('public-media','private-docs')
         and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own folder" on storage.objects for delete to authenticated
  using (bucket_id in ('public-media','private-docs')
         and (storage.foldername(name))[1] = auth.uid()::text);
create policy "public media read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'public-media');
create policy "private docs read own" on storage.objects for select to authenticated
  using (bucket_id = 'private-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Service categories (admin can add more from /admin/categories)
insert into public.service_categories (slug, name, name_ur, grp, icon, sort) values
  ('electrician',      'Electrician',          'الیکٹریشن',        'Repair & Maintenance', '⚡', 10),
  ('plumber',          'Plumber',              'پلمبر',            'Repair & Maintenance', '🚰', 20),
  ('carpenter',        'Carpenter',            'بڑھئی',            'Repair & Maintenance', '🪚', 30),
  ('painter',          'Painter',              'پینٹر',            'Repair & Maintenance', '🎨', 40),
  ('ac-repair',        'AC Repair & Service',  'اے سی مرمت',       'Repair & Maintenance', '❄️', 50),
  ('appliance-repair', 'Appliance Repair',     'فریج / واشنگ مشین', 'Repair & Maintenance', '🔧', 60),
  ('mason',            'Mason (Mistri)',       'مستری',            'Repair & Maintenance', '🧱', 70),
  ('welder',           'Welder',               'ویلڈر',            'Repair & Maintenance', '🔥', 80),
  ('solar',            'Solar Installer',      'سولر',             'Repair & Maintenance', '☀️', 90),
  ('cctv-internet',    'CCTV / Internet',      'سی سی ٹی وی',      'Repair & Maintenance', '📹', 95),
  ('maid',             'Maid (Masi)',          'ماسی',             'Household Help',       '🧹', 110),
  ('cook',             'Cook',                 'باورچی',           'Household Help',       '🍳', 120),
  ('driver',           'Driver',               'ڈرائیور',          'Household Help',       '🚗', 130),
  ('gardener',         'Gardener (Mali)',      'مالی',             'Household Help',       '🌿', 140),
  ('guard',            'Security Guard',       'چوکیدار',          'Household Help',       '🛡️', 150),
  ('rickshaw',         'Rickshaw',             'رکشہ',             'Transport',            '🛺', 210),
  ('loader',           'Loader / Shifting',    'شفٹنگ',            'Transport',            '🚚', 220),
  ('school-van',       'School Van',           'سکول وین',         'Transport',            '🚐', 230),
  ('deep-cleaning',    'Home Deep Cleaning',   'گھر کی صفائی',     'Cleaning',             '🧽', 310),
  ('tank-cleaning',    'Water Tank Cleaning',  'ٹینکی صفائی',      'Cleaning',             '💧', 320),
  ('pest-control',     'Pest Control',         'کیڑے مار سپرے',    'Cleaning',             '🐜', 330),
  ('sewerage',         'Gutter / Sewerage',    'گٹر صفائی',        'Cleaning',             '🕳️', 340),
  ('tailor',           'Tailor',               'درزی',             'Other',                '🧵', 410),
  ('laundry',          'Laundry / Dhobi',      'دھوبی',            'Other',                '👕', 420),
  ('tutor',            'Home Tutor',           'ٹیوٹر',            'Other',                '📚', 430),
  ('beautician',       'Beautician (Home)',    'بیوٹیشن',          'Other',                '💄', 440)
on conflict (slug) do nothing;
