-- =====================================================================
-- PDS.ushuaia · 0022 — Modelo marketplace (estilo Rappi)
-- =====================================================================
-- Cambia el modelo de agenda: en vez de que el admin asigne, el cliente
-- reserva turno por turno eligiendo un paseador LIBRE (según "Mis horarios"
-- del paseador y que no esté ya ocupado). El paseador ACEPTA o RECHAZA.
--
--   solicitado  → el cliente pidió a ese paseador (esperando respuesta)
--   confirmado  → 'scheduled' (el paseador aceptó)
--   rechazado   → el paseador rechazó (el cliente elige otro)
--
-- Se corre en el SQL Editor de Supabase (idempotente donde se puede).
-- =====================================================================

-- ---------- 1) Foto del paseador ----------
alter table public.profiles
  add column if not exists photo_url text;

-- El candado de rol (0007) revocó update y solo permitió (full_name, phone,
-- city). Sumamos photo_url para que el paseador pueda subir su foto.
grant update (photo_url) on public.profiles to authenticated;

-- Aseguramos que exista una policy de auto-edición (por si el nombre difiere).
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- 2) Estados nuevos del turno ----------
alter table public.appointments
  add column if not exists responded_at timestamptz;

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check
  check (status in ('requested','scheduled','rejected','done','canceled'));

-- ---------- 3) Que rechazados/cancelados NO bloqueen el horario ----------
-- Antes había uniques "duros" (walker_id, scheduled_at) y (dog_id, scheduled_at).
-- Los reemplazamos por uniques PARCIALES: solo cuentan los turnos ACTIVOS
-- (solicitado o confirmado). Así un paseador que rechazó queda libre otra vez,
-- y el cliente puede pedirle a otro en el mismo horario.
alter table public.appointments
  drop constraint if exists appointments_walker_id_scheduled_at_key;
drop index if exists public.appts_dog_sched_ux;

create unique index if not exists appts_walker_active_ux
  on public.appointments (walker_id, scheduled_at)
  where status in ('requested','scheduled') and walker_id is not null;

create unique index if not exists appts_dog_active_ux
  on public.appointments (dog_id, scheduled_at)
  where status in ('requested','scheduled');

-- ---------- 4) Info pública del paseador (foto + nombre) ----------
-- Vista con SOLO las columnas públicas (no expone teléfono ni ciudad).
create or replace view public.public_walkers
with (security_invoker = false) as
  select id, full_name, photo_url
  from public.profiles
  where role = 'walker' and active;

grant select on public.public_walkers to authenticated;

-- ---------- 5) Paseadores LIBRES para un día/franja ----------
-- SECURITY DEFINER: consulta disponibilidad + turnos sin disparar RLS, y
-- devuelve solo la info pública. Un paseador está libre si:
--   (a) tiene "Mis horarios" que cubren esa franja ese día, y
--   (b) no tiene un turno activo (solicitado/confirmado) a esa hora exacta.
create or replace function public.available_walkers(
  p_scheduled_at timestamptz,
  p_weekday      int,
  p_slot_start   time,
  p_slot_end     time
)
returns table (id uuid, full_name text, photo_url text)
language sql security definer stable set search_path = public as $$
  select p.id, p.full_name, p.photo_url
  from public.profiles p
  where p.role = 'walker'
    and p.active
    and exists (
      select 1 from public.walker_availability wa
      where wa.walker_id = p.id
        and wa.weekday   = p_weekday
        and wa.start_time <= p_slot_start
        and wa.end_time   >= p_slot_end
    )
    and not exists (
      select 1 from public.appointments a
      where a.walker_id = p.id
        and a.scheduled_at = p_scheduled_at
        and a.status in ('requested','scheduled')
    )
  order by p.full_name;
$$;

grant execute on function
  public.available_walkers(timestamptz, int, time, time) to authenticated;

-- ---------- 6) Storage de fotos del paseador ----------
insert into storage.buckets (id, name, public)
values ('walker-photos', 'walker-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "walker_photos_public_read" on storage.objects;
create policy "walker_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'walker-photos');

drop policy if exists "walker_photos_owner_insert" on storage.objects;
create policy "walker_photos_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'walker-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "walker_photos_owner_update" on storage.objects;
create policy "walker_photos_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'walker-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'walker-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "walker_photos_owner_delete" on storage.objects;
create policy "walker_photos_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'walker-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
