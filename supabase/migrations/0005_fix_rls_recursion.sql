-- =====================================================================
-- PDS.ushuaia · 0005 — Fix recursión de RLS entre dogs y appointments
-- =====================================================================
-- Problema detectado en test funcional: al cargar /cliente/perros la app
-- fallaba con "infinite recursion detected in policy for relation dogs".
--
-- Causa: la policy dogs_walker_select (en dogs) consultaba appointments,
-- y appts_owner_select (en appointments) consultaba dogs → ciclo infinito.
--
-- Solución (patrón estándar Supabase): funciones SECURITY DEFINER que
-- consultan sin disparar RLS, rompiendo el ciclo.
-- =====================================================================

create or replace function public.owns_dog(dog uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from dogs d where d.id = dog and d.owner_id = auth.uid());
$$;

create or replace function public.walker_has_dog(dog uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from appointments a where a.dog_id = dog and a.walker_id = auth.uid());
$$;

-- dogs: el paseador ve los perros asignados (sin recursión)
drop policy if exists dogs_walker_select on dogs;
create policy dogs_walker_select on dogs
  for select using ( public.walker_has_dog(id) );

-- appointments: el dueño gestiona los turnos de sus perros (sin recursión)
drop policy if exists appts_owner_select on appointments;
create policy appts_owner_select on appointments
  for select using ( public.owns_dog(dog_id) );

drop policy if exists appts_owner_insert on appointments;
create policy appts_owner_insert on appointments
  for insert to authenticated
  with check ( walker_id is null and public.owns_dog(dog_id) );

drop policy if exists appts_owner_delete on appointments;
create policy appts_owner_delete on appointments
  for delete to authenticated
  using ( walker_id is null and status = 'scheduled' and public.owns_dog(dog_id) );
