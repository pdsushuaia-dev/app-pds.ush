-- =====================================================================
-- PDS.ushuaia · 0009 — Reseñas privadas de paseos
-- =====================================================================
-- Reemplaza la tabla `reviews` placeholder de la 0001 (esquema viejo, vacía
-- y sin uso) por el modelo real: una reseña por walk finalizado.
-- Privacidad: la ve el cliente autor y el admin. El paseador NO.
-- =====================================================================

drop table if exists public.reviews cascade;

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  walk_id    uuid not null references public.walks(id) on delete cascade unique,
  dog_id     uuid not null references public.dogs(id),
  client_id  uuid not null references auth.users(id),
  walker_id  uuid references auth.users(id),
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);
create index if not exists reviews_walker_idx on public.reviews(walker_id);

alter table public.reviews enable row level security;

-- insert: solo el cliente autor.
drop policy if exists reviews_client_insert on public.reviews;
create policy reviews_client_insert on public.reviews
  for insert to authenticated
  with check (client_id = auth.uid());

-- select: el autor y el admin (mismo helper is_admin() que usan las demás
-- tablas). El paseador NO. is_admin() es SECURITY DEFINER → sin recursión.
drop policy if exists reviews_select_author_or_admin on public.reviews;
create policy reviews_select_author_or_admin on public.reviews
  for select
  using (client_id = auth.uid() or public.is_admin());

grant select on public.reviews to authenticated;
grant insert (walk_id, dog_id, client_id, walker_id, rating, comment)
  on public.reviews to authenticated;
