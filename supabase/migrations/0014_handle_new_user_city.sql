-- =====================================================================
-- PDS.ushuaia · 0014 — handle_new_user incluye la ciudad
-- =====================================================================
-- El trigger que crea el profile ahora también toma la ciudad del metadata
-- del signup (raw_user_meta_data->>'city'). Sin esto, la ciudad elegida en el
-- registro solo se guardaría cuando hay sesión inmediata; con esto queda desde
-- la creación del profile (también con confirmación de email activada).
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, city)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
