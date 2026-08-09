-- =====================================================================
-- PDS.ushuaia · 0003 — Storage para fotos de perros
-- Bucket `dog-photos` con lectura pública y escritura del dueño.
--
-- Convención de rutas: cada usuario guarda dentro de su carpeta {uid}/...
-- (ej: "a1b2.../mi-perro.jpg"). Las políticas verifican que el primer
-- segmento del path sea el auth.uid() del usuario → solo gestiona lo suyo.
-- =====================================================================

-- Bucket con lectura pública
insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do update set public = true;

-- (RLS ya está activa en storage.objects por defecto en Supabase)

-- Lectura pública de las fotos del bucket
drop policy if exists "dog_photos_public_read" on storage.objects;
create policy "dog_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'dog-photos');

-- El dueño sube archivos dentro de su carpeta {uid}/...
drop policy if exists "dog_photos_owner_insert" on storage.objects;
create policy "dog_photos_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- El dueño actualiza sus propios archivos
drop policy if exists "dog_photos_owner_update" on storage.objects;
create policy "dog_photos_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- El dueño borra sus propios archivos
drop policy if exists "dog_photos_owner_delete" on storage.objects;
create policy "dog_photos_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
