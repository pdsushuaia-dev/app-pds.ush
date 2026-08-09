-- =====================================================================
-- PDS.ushuaia · 0007 — Alta de paseadores por código + fix escalación de rol
-- =====================================================================
-- Hallazgo de seguridad: `authenticated` tenía UPDATE sobre TODAS las
-- columnas de profiles y la policy profiles_update_self permite editar la
-- fila propia → cualquier usuario podía hacerse admin (privilege escalation).
-- Fix: limitar las columnas editables por el usuario a nombre/tel/ciudad.
-- Además: función SECURITY DEFINER para redimir un código de invitación y
-- convertirse en paseador (única vía para obtener role='walker').
-- =====================================================================

-- 1) Bloquear cambio de rol por el propio usuario
revoke update on public.profiles from authenticated;
grant update (full_name, phone, city) on public.profiles to authenticated;

-- 2) Redención de código de invitación → role='walker'
create or replace function public.redeem_walker_invite(invite_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  select * into inv
  from walker_invites
  where code = invite_code and used_by is null
  limit 1;

  if inv is null then
    raise exception 'Código inválido o ya utilizado';
  end if;

  update walker_invites
  set used_by = auth.uid(), used_at = now()
  where id = inv.id;

  update profiles set role = 'walker' where id = auth.uid();
  return 'ok';
end;
$$;

grant execute on function public.redeem_walker_invite(text) to authenticated;
