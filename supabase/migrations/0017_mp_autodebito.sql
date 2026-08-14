-- =====================================================================
-- PDS.ushuaia · 0017 — Débito automático (MercadoPago Suscripciones)
-- =====================================================================
-- Cada suscripción puede tener una "preapproval" de MercadoPago: el cliente
-- autoriza su tarjeta una vez y MP debita la cuota cada mes. Guardamos el id
-- y el estado que reporta MP. Estas columnas las escribe SOLO el server
-- (service-role: la acción de alta y el webhook), no el cliente.
-- =====================================================================

alter table public.subscriptions
  add column if not exists mp_preapproval_id text,
  add column if not exists mp_status text;
-- mp_status: pending | authorized | paused | cancelled (según MercadoPago)

create index if not exists subs_mp_preapproval_idx
  on public.subscriptions (mp_preapproval_id);
