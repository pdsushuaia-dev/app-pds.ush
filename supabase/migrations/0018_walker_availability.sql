-- =====================================================================
-- PDS.ushuaia · 0018 — Horarios laborales del paseador (disponibilidad libre)
-- =====================================================================
-- Cada paseador arma sus propios rangos horarios por día (sin franjas fijas).
-- El admin usa esta disponibilidad para asignarle solo turnos en su horario.
-- =====================================================================

create table if not exists public.walker_availability (
  id         uuid primary key default gen_random_uuid(),
  walker_id  uuid not null references public.profiles(id) on delete cascade,
  weekday    int  not null check (weekday between 0 and 6), -- 0=domingo ... 6=sábado
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  constraint avail_valid_range check (end_time > start_time)
);
create index if not exists walker_avail_idx
  on public.walker_availability (walker_id, weekday);

alter table public.walker_availability enable row level security;

-- El paseador gestiona su propia disponibilidad; el admin ve/gestiona todo.
drop policy if exists avail_owner_or_admin on public.walker_availability;
create policy avail_owner_or_admin on public.walker_availability
  for all to authenticated
  using (walker_id = auth.uid() or public.is_admin())
  with check (walker_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.walker_availability to authenticated;
