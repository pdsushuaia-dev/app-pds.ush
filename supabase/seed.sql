-- =====================================================================
-- PDS.ushuaia · Seed del catálogo de planes (datos reales)
-- Precios "desde" del catálogo oficial (infografía del cliente).
-- Requiere haber corrido antes: 0001_init.sql y 0002_planes_flexibles.sql
-- Re-ejecutable (upsert): actualiza nombre y precio si el plan ya existe.
-- =====================================================================

-- Planes con días fijos (2 a 6 por semana)
insert into plans (name, days_per_week, price) values
  ('Básico',      2, 100000),   -- 8 paseos/mes  (2 por semana)
  ('Activo',      3, 129000),   -- 12 paseos/mes (3 por semana)
  ('Equilibrio',  4, 179000),   -- 16 paseos/mes (4 por semana)
  ('Bienestar',   5, 209000),   -- 20 paseos/mes (5 por semana)
  ('Performance', 6, 249000)    -- 24 paseos/mes (6 por semana) · "Más elegido"
on conflict (days_per_week) do update
  set name = excluded.name, price = excluded.price;

-- Plan personalizado (sin días fijos, precio a convenir)
insert into plans (name, days_per_week, price)
select 'Aventura Pro', null, null
where not exists (select 1 from plans where name = 'Aventura Pro');
