-- =====================================================================
-- 0014  Security fixes from the final audit
--  * private file paths: a user can only attach files from their OWN folder
--  * society admins can't change status / chairman directly (only via the app flow)
--  * a provider can't verify / suspend his own profile through a society he runs
--  * listings: house link only for the verified owner of that house
--  * lead notifications only for logged-in contacts, once per hour per person
-- Run after 0013. Safe to run more than once.
-- =====================================================================

-- ------------------------------------------------------------- own-folder file paths
-- Paths look like "<user uuid>/<folder>/<file>". Anything else coming from a user is dropped.
create or replace function public.guard_own_paths() returns trigger
language plpgsql security definer set search_path = public as $$
declare col text; n jsonb := to_jsonb(new); o jsonb; v text; me text := auth.uid()::text;
begin
  if me is null or public.is_super_admin() then return new; end if; -- server / service role / platform admin
  if tg_op = 'UPDATE' then o := to_jsonb(old); end if;
  foreach col in array tg_argv loop
    v := n ->> col;
    if v is not null and (o is null or v is distinct from o ->> col) and v not like me || '/%' then
      n := jsonb_set(n, array[col], 'null'::jsonb);
    end if;
  end loop;
  return jsonb_populate_record(new, n);
end $$;

drop trigger if exists guard_paths on public.welfare_issues;
create trigger guard_paths before insert or update on public.welfare_issues
  for each row execute function public.guard_own_paths('photo_path', 'resolution_photo_path');
drop trigger if exists guard_paths on public.welfare_issue_updates;
create trigger guard_paths before insert or update on public.welfare_issue_updates
  for each row execute function public.guard_own_paths('photo_path');
drop trigger if exists guard_paths on public.fund_expenses;
create trigger guard_paths before insert or update on public.fund_expenses
  for each row execute function public.guard_own_paths('receipt_path');
drop trigger if exists guard_paths on public.payments;
create trigger guard_paths before insert or update on public.payments
  for each row execute function public.guard_own_paths('proof_path');
drop trigger if exists guard_paths on public.providers;
create trigger guard_paths before insert or update on public.providers
  for each row execute function public.guard_own_paths('photo_path', 'cnic_front_path', 'cnic_back_path');

-- ------------------------------------------------------------- society: status and chairman are protected
create or replace function public.societies_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_super_admin() then
    new.status := old.status;
    new.slug := old.slug;
    new.chairman_user_id := old.chairman_user_id;
    new.chairman_phone := old.chairman_phone;
  end if;
  return new;
end $$;
drop trigger if exists societies_guard on public.societies;
create trigger societies_guard before update on public.societies
  for each row execute function public.societies_guard();

-- ------------------------------------------------------------- provider status: never your own profile
create or replace function public.set_provider_status(p_provider uuid, p_status text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('verified','suspended','rejected','pending') then raise exception 'ghalat status'; end if;
  if not public.is_super_admin() then
    if exists (select 1 from providers where id = p_provider and user_id = auth.uid()) then
      raise exception 'apni profile khud verify / band nahi kar sakte';
    end if;
    if not exists (select 1 from provider_societies ps where ps.provider_id = p_provider and public.is_society_admin(ps.society_id)) then
      raise exception 'not allowed';
    end if;
  end if;
  perform set_config('app.provider_status', '1', true);
  update providers set status = p_status where id = p_provider;
  perform set_config('app.provider_status', '', true);
  return p_status;
end $$;
revoke execute on function public.set_provider_status(uuid, text) from public, anon;
grant execute on function public.set_provider_status(uuid, text) to authenticated;

-- ------------------------------------------------------------- listings: house link only for its verified owner
create or replace function public.listings_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.house_id is not null and exists (
      select 1 from house_owners ho
       where ho.house_id = new.house_id and ho.user_id = new.owner_id and ho.status = 'verified' and ho.relation = 'owner') then
    new.society_verified := true;
    select society_id into new.society_id from houses where id = new.house_id;
  else
    new.house_id := null;
    new.society_id := null;
    new.society_verified := false;
  end if;
  if tg_op = 'UPDATE' and auth.uid() is not null
     and not public.is_super_admin() and new.owner_id <> old.owner_id then
    new.owner_id := old.owner_id;
  end if;
  return new;
end $$;

-- ------------------------------------------------------------- lead notifications: logged-in only, once an hour
create or replace function public.trg_notify_property_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare o uuid; t text; who text; via text;
begin
  if new.kind not in ('call','whatsapp') or new.user_id is null then return new; end if;
  if exists (select 1 from contact_events c
              where c.id <> new.id and c.user_id = new.user_id and c.kind in ('call','whatsapp')
                and c.created_at > now() - interval '1 hour'
                and (c.listing_id = new.listing_id or c.want_id = new.want_id)) then
    return new;
  end if;
  via := case when new.kind = 'call' then 'call' else 'WhatsApp' end;
  select coalesce(full_name, 'Koi') into who from profiles where id = new.user_id;
  who := coalesce(who, 'Koi');
  if new.listing_id is not null then
    select owner_id, title into o, t from property_listings where id = new.listing_id;
    perform notify_users(array[o], 'property', who || ' ne aap ki listing par ' || via || ' kiya', t, '/my/listings', new.user_id);
  elsif new.want_id is not null then
    select user_id, case when want_type = 'buy' then 'Khareedne ki demand' else 'Kiraye ki demand' end || ' — ' || city into o, t from property_wants where id = new.want_id;
    perform notify_users(array[o], 'property', who || ' ne aap ki demand par ' || via || ' kiya', t, '/my/listings?tab=wants', new.user_id);
  end if;
  return new;
end $$;
