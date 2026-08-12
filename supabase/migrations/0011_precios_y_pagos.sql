-- =====================================================================
-- PDS.ushuaia · 0011 — Precio personalizado por suscripción + cobros manuales
-- =====================================================================

-- ---------- 1) Precio personalizado por suscripción ----------
alter table public.subscriptions
  add column if not exists custom_price integer
  check (custom_price is null or custom_price >= 0);

-- El cliente puede cambiar plan/estado de su suscripción, pero NO el precio.
-- Se bloquea la columna a nivel grant (mismo patrón que 0007 con profiles):
revoke update on public.subscriptions from authenticated;
grant update (plan_id, status) on public.subscriptions to authenticated;

-- El admin setea el precio vía función SECURITY DEFINER (bypassa el grant y
-- valida is_admin adentro). Única vía para tocar custom_price desde la API.
create or replace function public.admin_set_subscription_price(
  p_subscription_id uuid,
  p_price integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  if p_price is not null and p_price < 0 then
    raise exception 'Precio inválido';
  end if;
  update public.subscriptions set custom_price = p_price
   where id = p_subscription_id;
end;
$$;
grant execute on function public.admin_set_subscription_price(uuid, integer) to authenticated;

-- ---------- 2) Pagos manuales por suscripción / mes ----------
alter table public.payments add column if not exists paid_at timestamptz;
alter table public.payments add column if not exists method text not null default 'manual';
-- period ('YYYY-MM') y amount ya existen. Un pago por suscripción por período:
create unique index if not exists payments_sub_period_ux
  on public.payments (subscription_id, period);

grant select, insert, update on public.payments to authenticated;
-- RLS existente (0001): payments_owner_select (dueño SELECT) · payments_admin (admin ALL).
