-- =====================================================================
-- PDS.ushuaia · 0006 — Habilitar Realtime para el mapa en vivo del cliente
-- =====================================================================
-- Supabase Realtime solo emite cambios de tablas que estén en la
-- publicación `supabase_realtime`. Sin esto, el cliente no recibiría
-- los puntos GPS en vivo.
--   - walk_positions: los puntos del recorrido (el puntito que se mueve)
--   - walks: para detectar inicio/fin del paseo en tiempo real
-- Idempotente: se puede correr varias veces sin error.
-- =====================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'walk_positions'
  ) then
    alter publication supabase_realtime add table walk_positions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'walks'
  ) then
    alter publication supabase_realtime add table walks;
  end if;
end $$;
