-- =====================================================================
-- PDS.ushuaia · 0020 — Rol Bañador
-- =====================================================================
-- Nuevo rol 'bather' (bañador): ve los turnos de baño que agendan los
-- clientes y los puede marcar como hechos. Se crea por el admin (igual que
-- el paseador) y tiene su propio panel /banador.
-- =====================================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('client', 'walker', 'admin', 'bather'));

-- El bañador ve todos los turnos de baño y los puede actualizar (marcar hecho).
drop policy if exists bath_bather_select on public.bath_appointments;
create policy bath_bather_select on public.bath_appointments
  for select to authenticated
  using (public.user_role() = 'bather');

drop policy if exists bath_bather_update on public.bath_appointments;
create policy bath_bather_update on public.bath_appointments
  for update to authenticated
  using (public.user_role() = 'bather')
  with check (public.user_role() = 'bather');

-- Para mostrar el nombre del perro en cada baño, el bañador puede leer dogs.
drop policy if exists dogs_bather_select on public.dogs;
create policy dogs_bather_select on public.dogs
  for select to authenticated
  using (public.user_role() = 'bather');
