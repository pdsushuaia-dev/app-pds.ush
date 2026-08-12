-- =====================================================================
-- PDS.ushuaia · 0013 — Historial de paseos del cliente
-- =====================================================================
-- Función de solo lectura (sin cambio de tablas). SECURITY DEFINER para poder
-- incluir el nombre del paseador (el cliente no puede leer profiles ajenos),
-- pero scopeada a auth.uid(): el cliente solo ve los paseos de sus perros.
-- Devuelve solo el full_name del paseador (no teléfono/ciudad).
-- =====================================================================

create or replace function public.client_walk_history(p_limit int default 50)
returns table (
  walk_id     uuid,
  dog_name    text,
  walker_name text,
  ended_at    timestamptz,
  started_at  timestamptz,
  distance_m  numeric,
  duration_s  int,
  media_count int
)
language sql security definer stable set search_path = public as $$
  select w.id, d.name, wp.full_name, w.ended_at, w.started_at, w.distance_m, w.duration_s,
         (select count(*) from walk_media m where m.walk_id = w.id)::int
  from walks w
  join dogs d on d.id = w.dog_id
  left join profiles wp on wp.id = w.walker_id
  where w.status = 'done' and d.owner_id = auth.uid()
  order by coalesce(w.ended_at, w.started_at) desc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function public.client_walk_history(int) to authenticated;
