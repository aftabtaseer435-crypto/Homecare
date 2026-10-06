-- =====================================================================
-- Al-Quraish Phase 1, Multan — first society (live test data)
--  * 16 galiyan × 75 ghar = 1,200 ghar
--  * Welfare Agent 1 … 16 (one per gali), mobile 0300-0000001 … 0300-0000016
--  * Chairman (welfare committee head): Husnain Bhatti — society admin,
--    mobile 0300-0000100 (placeholder: change it from the Team page)
-- Safe to run more than once. Run AFTER migrations 0001–0005.
-- =====================================================================
do $$
declare sid uuid;
begin
  select id into sid from public.societies where slug = 'alquraish-phase-1-multan';
  if sid is null then
    insert into public.societies (name, slug, city, address, total_houses, status)
    values ('Al-Quraish Phase 1', 'alquraish-phase-1-multan', 'Multan', 'Al-Quraish Housing Scheme, Phase 1, Multan', 1200, 'active')
    returning id into sid;
  end if;

  -- 16 galiyan, 75 ghar har gali mein (no block)
  insert into public.houses (society_id, block, street, house_no)
  select sid, '', g::text, h::text
    from generate_series(1, 16) g, generate_series(1, 75) h
  on conflict (society_id, block, street, house_no) do nothing;

  -- Welfare Agent 1 … 16 — gali N ka zimmedar
  insert into public.welfare_agents (society_id, block, street, name, phone)
  select sid, '', g::text, 'Welfare Agent ' || g, '92300000' || lpad(g::text, 4, '0')
    from generate_series(1, 16) g
  on conflict do nothing;

  -- Chairman as society admin (linked on first login with this number)
  insert into public.society_member_invites (society_id, phone, name, role)
  values (sid, '923000000100', 'Husnain Bhatti', 'admin')
  on conflict (society_id, phone) do nothing;

  -- If any of these numbers already have an account, link them now
  perform public.link_phone_records(p.id, p.phone)
     from public.profiles p
    where p.phone in (select phone from public.welfare_agents where society_id = sid)
       or p.phone = '923000000100';
end $$;

-- Check
select s.name,
       (select count(*) from public.houses h where h.society_id = s.id) as ghar,
       (select count(distinct street) from public.houses h where h.society_id = s.id) as galiyan,
       (select count(*) from public.welfare_agents w where w.society_id = s.id and w.active) as agents
  from public.societies s where s.slug = 'alquraish-phase-1-multan';
