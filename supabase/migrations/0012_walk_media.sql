-- =====================================================================
-- PDS.ushuaia · 0012 — Fotos y videos del paseo
-- =====================================================================
-- El paseador asignado sube fotos/videos (durante o después del paseo);
-- el dueño del perro y el admin las ven. Bucket público (como dog-photos).
-- =====================================================================

create table if not exists public.walk_media (
  id           uuid primary key default gen_random_uuid(),
  walk_id      uuid not null references public.walks(id) on delete cascade,
  storage_path text not null,
  media_type   text not null check (media_type in ('photo','video')),
  created_at   timestamptz not null default now()
);
create index if not exists walk_media_walk_idx on public.walk_media(walk_id);

-- Helpers SECURITY DEFINER (sin recursión de RLS, patrón 0005).
create or replace function public.can_view_walk(w_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from walks w
    where w.id = w_id and (
      w.walker_id = auth.uid()
      or exists (select 1 from dogs d where d.id = w.dog_id and d.owner_id = auth.uid())
    )
  );
$$;

create or replace function public.is_walk_walker(w_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from walks w where w.id = w_id and w.walker_id = auth.uid());
$$;

-- RLS de la tabla
alter table public.walk_media enable row level security;

drop policy if exists walk_media_select on public.walk_media;
create policy walk_media_select on public.walk_media
  for select using (public.is_admin() or public.can_view_walk(walk_id));

drop policy if exists walk_media_walker_insert on public.walk_media;
create policy walk_media_walker_insert on public.walk_media
  for insert to authenticated with check (public.is_walk_walker(walk_id));

drop policy if exists walk_media_delete on public.walk_media;
create policy walk_media_delete on public.walk_media
  for delete to authenticated
  using (public.is_admin() or public.is_walk_walker(walk_id));

grant select, insert, delete on public.walk_media to authenticated;

-- Bucket de Storage (lectura pública, como dog-photos)
insert into storage.buckets (id, name, public)
values ('walk-media', 'walk-media', true)
on conflict (id) do update set public = true;

drop policy if exists walk_media_public_read on storage.objects;
create policy walk_media_public_read on storage.objects
  for select using (bucket_id = 'walk-media');

-- El paseador asignado sube a la carpeta {walk_id}/...
drop policy if exists walk_media_owner_insert on storage.objects;
create policy walk_media_owner_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'walk-media'
    and public.is_walk_walker(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists walk_media_owner_delete on storage.objects;
create policy walk_media_owner_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'walk-media'
    and (public.is_admin() or public.is_walk_walker(((storage.foldername(name))[1])::uuid))
  );
