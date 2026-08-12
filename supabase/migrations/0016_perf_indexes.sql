-- =====================================================================
-- PDS.ushuaia · 0016 — Índices de performance
-- =====================================================================
-- Los paneles filtran appointments por (status='scheduled' + scheduled_at)
-- y walks por status, sin usar walker_id/dog_id. Los índices previos no
-- cubren esos predicados → seq scan en tablas que crecen. Estos los cubren.
-- =====================================================================

create index if not exists appts_status_sched_idx
  on public.appointments (status, scheduled_at);

create index if not exists walks_status_idx
  on public.walks (status);
