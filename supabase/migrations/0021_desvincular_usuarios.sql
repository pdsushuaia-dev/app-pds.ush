-- =====================================================================
-- PDS.ushuaia · 0021 — Desvinculación de usuarios (activo / inactivo)
-- =====================================================================
-- El admin puede "desvincular" a un cliente o paseador que ya no trabaja con
-- el negocio: se marca active=false y deja de poder entrar a la app (se valida
-- en el login y en el middleware). Es reversible (reactivar) y no borra datos.
-- =====================================================================

alter table public.profiles add column if not exists active boolean not null default true;
