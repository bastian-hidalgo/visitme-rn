-- Provide residents only the occupancy fields needed to render availability.
-- The helper bypasses reservation-row RLS, so it strictly validates community
-- membership and never returns personal or payment data.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.get_common_space_reservation_availability(
  p_common_space_id uuid,
  p_community_id uuid,
  p_from_date date,
  p_to_date date
)
returns table (
  date date,
  block public.block_type,
  time_section_id uuid
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null
     or p_common_space_id is null
     or p_community_id is null
     or p_from_date is null
     or p_to_date is null
     or p_to_date < p_from_date
     or p_to_date > p_from_date + 62 then
    raise exception 'Invalid availability request' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.user_departments ud
    where ud.user_id = auth.uid()
      and ud.community_id = p_community_id
      and ud.active = true
  ) or not exists (
    select 1
    from public.common_spaces cs
    where cs.id = p_common_space_id
      and cs.community_id = p_community_id
  ) then
    raise exception 'Not authorized to view this availability' using errcode = '42501';
  end if;

  return query
  select r.date, r.block, r.time_section_id
  from public.common_space_reservations r
  where r.common_space_id = p_common_space_id
    and r.community_id = p_community_id
    and r.date between p_from_date and p_to_date
    and r.status in (
      'agendado'::public.reservation_status,
      'activo'::public.reservation_status
    );
end;
$$;

revoke all on function private.get_common_space_reservation_availability(uuid, uuid, date, date)
  from public, anon;
grant execute on function private.get_common_space_reservation_availability(uuid, uuid, date, date)
  to authenticated;

create or replace function public.get_common_space_reservation_availability(
  p_common_space_id uuid,
  p_community_id uuid,
  p_from_date date,
  p_to_date date
)
returns table (
  date date,
  block public.block_type,
  time_section_id uuid
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select *
  from private.get_common_space_reservation_availability(
    p_common_space_id,
    p_community_id,
    p_from_date,
    p_to_date
  );
$$;

revoke all on function public.get_common_space_reservation_availability(uuid, uuid, date, date)
  from public, anon;
grant execute on function public.get_common_space_reservation_availability(uuid, uuid, date, date)
  to authenticated;
