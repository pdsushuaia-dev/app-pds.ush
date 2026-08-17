-- =====================================================================
-- PDS.ushuaia · 0019 — Turnos cada 2 horas (09 a 21)
-- =====================================================================
-- Pasa de las 3 franjas fijas (morning/midday/afternoon) a slots por hora,
-- cada 2 h: 09, 11, 13, 15, 17, 19 (cada turno = 1:30 paseo + 30 min traslado).
-- ORDEN IMPORTANTE: primero sacamos el CHECK viejo, después migramos los
-- datos, y recién al final ponemos el CHECK nuevo (si no, el update choca
-- con la regla anterior).
-- =====================================================================

alter table public.schedule_rules drop constraint if exists schedule_rules_time_slot_check;
alter table public.appointments  drop constraint if exists appointments_time_slot_check;

update public.schedule_rules set time_slot = case time_slot
    when 'morning' then '09' when 'midday' then '13' when 'afternoon' then '17'
    else time_slot end
  where time_slot in ('morning', 'midday', 'afternoon');

update public.appointments set time_slot = case time_slot
    when 'morning' then '09' when 'midday' then '13' when 'afternoon' then '17'
    else time_slot end
  where time_slot in ('morning', 'midday', 'afternoon');

alter table public.schedule_rules add constraint schedule_rules_time_slot_check
  check (time_slot is null or time_slot in ('09', '11', '13', '15', '17', '19'));

alter table public.appointments add constraint appointments_time_slot_check
  check (time_slot is null or time_slot in ('09', '11', '13', '15', '17', '19'));
