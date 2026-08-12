-- =====================================================================
-- PDS.ushuaia · 0015 — Turnos de baño (agendados por el cliente)
-- =====================================================================
-- Sección simple para que el cliente agende el baño de su perro.
-- Sin integración externa: el dueño gestiona los baños de sus perros y
-- el admin los ve/gestiona todos. Reusa owns_dog()/is_admin() (0005/0001).
-- =====================================================================

create table if not exists public.bath_appointments (
  id           uuid primary key default gen_random_uuid(),
  dog_id       uuid not null references public.dogs(id) on delete cascade,
  scheduled_at timestamptz not null,
  status       text not null default 'requested'
               check (status in ('requested', 'confirmed', 'done', 'canceled')),
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists bath_appointments_dog_idx
  on public.bath_appointments (dog_id);

alter table public.bath_appointments enable row level security;

-- El dueño gestiona los baños de sus perros; el admin ve/gestiona todos.
drop policy if exists bath_owner_all on public.bath_appointments;
create policy bath_owner_all on public.bath_appointments
  for all to authenticated
  using (public.owns_dog(dog_id) or public.is_admin())
  with check (public.owns_dog(dog_id) or public.is_admin());

grant select, insert, update, delete on public.bath_appointments to authenticated;
