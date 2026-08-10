-- =====================================================================
-- PDS.ushuaia · 0010 — Banners / novedades
-- =====================================================================
-- El admin publica avisos; el cliente ve solo los vigentes (activos y
-- dentro de la ventana starts_at/ends_at).
-- =====================================================================

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  active     boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index if not exists banners_active_idx on public.banners(active);

alter table public.banners enable row level security;

-- select: vigentes para cualquier autenticado, o todo si es admin.
drop policy if exists banners_select_vigente_or_admin on public.banners;
create policy banners_select_vigente_or_admin on public.banners
  for select to authenticated
  using (
    public.is_admin()
    or (
      active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    )
  );

-- escritura: solo admin (is_admin() SECURITY DEFINER, sin recursión).
drop policy if exists banners_admin_insert on public.banners;
create policy banners_admin_insert on public.banners
  for insert to authenticated with check (public.is_admin());

drop policy if exists banners_admin_update on public.banners;
create policy banners_admin_update on public.banners
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists banners_admin_delete on public.banners;
create policy banners_admin_delete on public.banners
  for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.banners to authenticated;
