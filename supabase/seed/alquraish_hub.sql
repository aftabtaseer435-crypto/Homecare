-- =====================================================================
-- Al-Quraish Phase 1, Multan — hub page details + development projects
-- Run AFTER 0006_hub_notices.sql and alquraish_phase1.sql. Safe to re-run.
-- Text and pictures are placeholders: change them from the admin panel
-- (Society page tab) whenever real details / photos are ready.
-- =====================================================================
do $$
declare sid uuid;
begin
  select id into sid from public.societies where slug = 'alquraish-phase-1-multan';
  if sid is null then raise exception 'Pehle alquraish_phase1.sql chalayein'; end if;

  update public.societies set
    tagline       = coalesce(tagline, 'Saaf galiyan, roshan raatein, har rupay ka hisaab'),
    about         = coalesce(about, 'Al-Quraish Phase 1 Multan ki ek mukammal rehaishi society hai — 16 galiyan aur 1,200 ghar. Society ka intezam Al-Quraish Welfare Committee chalati hai jis ke chairman Husnain Bhatti hain. Har gali ka apna welfare agent hai jo us gali ke masle — street light, safai, pani, sewerage aur legal — ka zimmedar hai. Development fund ka har rupay is app par darj hota hai: kitna jama hua, kahan laga, aur raseed ke sath.'),
    chairman_name = coalesce(chairman_name, 'Husnain Bhatti'),
    chairman_phone = coalesce(chairman_phone, '923000000100'),
    welfare_name  = coalesce(welfare_name, 'Al-Quraish Welfare Committee'),
    office_hours  = coalesce(office_hours, 'Somvar – Hafta, subah 10 se shaam 6'),
    established   = coalesce(established, '2015'),
    amenities     = case when cardinality(amenities) = 0 then
                      array['Jamia Masjid','Bachon ka park','Main gate security','Street lights','Pakki sarkein','Pani ki supply','Sewerage system','Kachra uthana (rozana)']
                    else amenities end
  where id = sid;

  -- chairman already logged in? link now
  update public.societies s set chairman_user_id = p.id
    from public.profiles p
   where s.id = sid and s.chairman_user_id is null and p.phone = s.chairman_phone;
  insert into public.society_members (society_id, user_id, role)
  select sid, chairman_user_id, 'admin' from public.societies where id = sid and chairman_user_id is not null
  on conflict (society_id, user_id) do update set role = 'admin';

  if not exists (select 1 from public.society_projects where society_id = sid) then
    insert into public.society_projects (society_id, title, category, status, description, area, cost, progress, target_date, completed_on, sort) values
      (sid, 'LED street lights — har gali', 'lights', 'in_progress',
       'Purani tube lights ki jagah 60 watt LED lights. Har 3 khambon par ek light, raat bhar roshni aur bijli ka kam kharcha.',
       'Gali 1 – 16', 480000, 55, (current_date + 45), null, 10),
      (sid, 'Rozana safai aur kachra uthana', 'safai', 'done',
       '4 sweepers ki team: subah 7 se 11 tak har gali ki safai, kachra rozana uthaya jata hai. Har mahine naali ki khaas safai.',
       'Poori society', 85000, 100, null, (current_date - 20), 20),
      (sid, 'Main road carpeting', 'roads', 'planned',
       'Main gate se Jamia Masjid tak sarak ki nayi carpeting aur speed breakers par paint.',
       'Main road', 1250000, 0, (current_date + 120), null, 30),
      (sid, 'Sewerage lines ki safai', 'sewerage', 'in_progress',
       'Barish se pehle tamam manholes aur sewerage lines ki machine se safai, toote dhakkan tabdeel.',
       'Gali 9 – 16', 210000, 30, (current_date + 30), null, 40),
      (sid, 'Main gate security aur CCTV', 'security', 'planned',
       '24 ghante guard, visitor register aur gate par 4 CCTV cameras.',
       'Main gate', 350000, 0, (current_date + 90), null, 50),
      (sid, 'Bachon ka park — jhoole aur ghaas', 'parks', 'planned',
       'Park mein naye jhoole, benches aur ghaas. Shaam ko families ke liye mehfooz jagah.',
       'Central park', 300000, 0, (current_date + 150), null, 60);
  end if;
end $$;

select s.name, s.chairman_name, s.welfare_name, (select count(*) from public.society_projects where society_id = s.id) as projects
  from public.societies s where slug = 'alquraish-phase-1-multan';
