-- =====================================================================
-- PDS.ushuaia · 0002 — Planes flexibles
-- Permite planes "personalizados" (ej. "Aventura Pro") sin días fijos ni
-- precio cerrado: days_per_week y price pasan a ser NULL-ables.
--
-- Notas:
--  - El CHECK `days_per_week between 2 and 6` sigue válido: con NULL el
--    check evalúa a NULL (se considera aprobado), así que no hay que tocarlo.
--  - El UNIQUE(days_per_week) tolera múltiples NULL (Postgres trata cada
--    NULL como distinto), por eso el seed inserta el personalizado con
--    `where not exists` en vez de `on conflict`.
-- =====================================================================

alter table plans alter column days_per_week drop not null;
alter table plans alter column price         drop not null;
