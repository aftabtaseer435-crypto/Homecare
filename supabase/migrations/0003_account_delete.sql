-- Allow a user to delete their account (Google Play requirement) without
-- breaking society records: "who did it" columns become NULL instead of
-- blocking the delete.
alter table public.society_requests drop constraint if exists society_requests_reviewed_by_fkey,
  add constraint society_requests_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id) on delete set null;
alter table public.house_owners drop constraint if exists house_owners_verified_by_fkey,
  add constraint house_owners_verified_by_fkey foreign key (verified_by) references public.profiles(id) on delete set null;
alter table public.payments drop constraint if exists payments_entered_by_fkey,
  add constraint payments_entered_by_fkey foreign key (entered_by) references public.profiles(id) on delete set null;
alter table public.payments drop constraint if exists payments_verified_by_fkey,
  add constraint payments_verified_by_fkey foreign key (verified_by) references public.profiles(id) on delete set null;
alter table public.notices drop constraint if exists notices_created_by_fkey,
  add constraint notices_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
