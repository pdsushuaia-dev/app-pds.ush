-- =====================================================================
-- PDS.ushuaia · 0004 — Turnos por franja (self-service del cliente)
-- El cliente elige días + franja (mañana/mediodía/tarde) por suscripción;
-- el sistema genera appointments SIN paseador (walker_id null) y Agustín
-- asigna el paseador después.
-- (YA APLICADA en la base — archivo solo para versionado.)
-- =====================================================================

alter table schedule_rules
  add column if not exists time_slot text check (time_slot in ('morning','midday','afternoon'));
alter table schedule_rules alter column time_of_day drop not null;

alter table appointments
  add column if not exists time_slot text check (time_slot in ('morning','midday','afternoon'));
create unique index if not exists appts_dog_sched_ux on appointments (dog_id, scheduled_at);

drop policy if exists appts_owner_insert on appointments;
create policy appts_owner_insert on appointments
  for insert to authenticated
  with check (
    walker_id is null
    and exists (select 1 from dogs d where d.id = appointments.dog_id and d.owner_id = auth.uid())
  );

drop policy if exists appts_owner_delete on appointments;
create policy appts_owner_delete on appointments
  for delete to authenticated
  using (
    walker_id is null and status = 'scheduled'
    and exists (select 1 from dogs d where d.id = appointments.dog_id and d.owner_id = auth.uid())
  );
