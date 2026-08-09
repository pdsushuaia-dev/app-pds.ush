-- =====================================================================
-- PDS.ushuaia · 0008 — Web Push: suscripciones + recordatorios
-- =====================================================================
-- Guarda las suscripciones push por dispositivo/usuario y agrega la marca
-- reminded_at a appointments para no mandar el recordatorio dos veces.
-- =====================================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- El usuario solo gestiona sus propias suscripciones.
drop policy if exists push_subs_select_own on public.push_subscriptions;
create policy push_subs_select_own on public.push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists push_subs_insert_own on public.push_subscriptions;
create policy push_subs_insert_own on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());

-- update: necesario para el upsert por endpoint (re-suscripción del mismo device).
drop policy if exists push_subs_update_own on public.push_subscriptions;
create policy push_subs_update_own on public.push_subscriptions
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_subs_delete_own on public.push_subscriptions;
create policy push_subs_delete_own on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Recordatorio ya enviado para este turno (evita duplicados desde el cron).
alter table public.appointments
  add column if not exists reminded_at timestamptz;
