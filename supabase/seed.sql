-- Seed de catálogo de planes (precios placeholder — reemplazar con los reales de Agustín)
insert into plans (name, days_per_week, price) values
  ('Plan 2 días',  2, 0),
  ('Plan 3 días',  3, 0),
  ('Plan 4 días',  4, 0),
  ('Plan 5 días',  5, 0),
  ('Plan 6 días',  6, 0)
on conflict (days_per_week) do nothing;
