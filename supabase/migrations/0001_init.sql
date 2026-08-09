-- =====================================================================
-- PDS.ushuaia · Migración inicial (Fase 1)
-- Esquema base + RLS. Basado en la sección 4 del plan.
-- =====================================================================

-- ---------- Extensiones ----------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------- Enums (via CHECK para simplicidad y edición fácil) ----------
-- roles: client | walker | admin
-- ciudad: ushuaia | rio_grande

-- =====================================================================
-- PROFILES (extiende auth.users)
-- =====================================================================
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        text not null default 'client' check (role in ('client','walker','admin')),
  full_name   text,
  phone       text,
  city        text check (city in ('ushuaia','rio_grande')),
  created_at  timestamptz not null default now()
);

-- Helper: rol del usuario actual (SECURITY DEFINER evita recursión en RLS)
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Trigger: crear profile al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- DOGS
-- =====================================================================
create table if not exists dogs (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id) on delete cascade,
  name           text not null,
  breed          text,
  photo_url      text,
  pickup_address text,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists dogs_owner_idx on dogs(owner_id);

-- =====================================================================
-- PLANS (catálogo 2 a 6 días/semana)
-- =====================================================================
create table if not exists plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  days_per_week int not null check (days_per_week between 2 and 6),
  price         numeric(10,2) not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- SUBSCRIPTIONS
-- =====================================================================
create table if not exists subscriptions (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references dogs(id) on delete cascade,
  plan_id    uuid references plans(id),
  status     text not null default 'active' check (status in ('active','paused','overdue','canceled')),
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists subs_dog_idx on subscriptions(dog_id);

-- =====================================================================
-- SCHEDULE RULES (días/horarios fijos del plan)
-- =====================================================================
create table if not exists schedule_rules (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  weekday         int not null check (weekday between 0 and 6), -- 0=domingo
  time_of_day     time not null
);
create index if not exists rules_sub_idx on schedule_rules(subscription_id);

-- =====================================================================
-- APPOINTMENTS (turnos materializados)
-- Regla de negocio: 1 perro por turno por paseador.
-- =====================================================================
create table if not exists appointments (
  id           uuid primary key default gen_random_uuid(),
  dog_id       uuid not null references dogs(id) on delete cascade,
  walker_id    uuid references profiles(id) on delete set null,
  scheduled_at timestamptz not null,
  status       text not null default 'scheduled' check (status in ('scheduled','done','canceled')),
  created_at   timestamptz not null default now(),
  unique (walker_id, scheduled_at)  -- 1 perro por turno por paseador
);
create index if not exists appts_walker_idx on appointments(walker_id, scheduled_at);
create index if not exists appts_dog_idx on appointments(dog_id);

-- =====================================================================
-- WALKS
-- =====================================================================
create table if not exists walks (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  walker_id      uuid not null references profiles(id) on delete cascade,
  dog_id         uuid not null references dogs(id) on delete cascade,
  started_at     timestamptz,
  ended_at       timestamptz,
  distance_m     numeric,
  duration_s     int,
  status         text not null default 'in_progress' check (status in ('in_progress','done','canceled')),
  created_at     timestamptz not null default now()
);
create index if not exists walks_walker_idx on walks(walker_id);
create index if not exists walks_dog_idx on walks(dog_id);

-- =====================================================================
-- WALK POSITIONS (muestras GPS del recorrido)
-- =====================================================================
create table if not exists walk_positions (
  id          bigserial primary key,
  walk_id     uuid not null references walks(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  recorded_at timestamptz not null default now()
);
create index if not exists positions_walk_idx on walk_positions(walk_id, recorded_at);

-- =====================================================================
-- REVIEWS (privadas: solo admin puede leer)
-- =====================================================================
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references profiles(id) on delete cascade,
  dog_id     uuid references dogs(id) on delete set null,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ANNOUNCEMENTS (banners / novedades)
-- =====================================================================
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  body       text,
  image_url  text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- PAYMENTS
-- =====================================================================
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade,
  amount          numeric(10,2),
  status          text not null default 'pending' check (status in ('pending','paid','overdue','canceled')),
  mp_payment_id   text,
  period          text,  -- ej '2026-09'
  created_at      timestamptz not null default now()
);
create index if not exists payments_sub_idx on payments(subscription_id);

-- =====================================================================
-- WALKER INVITES (alta de paseador por código del admin)
-- =====================================================================
create table if not exists walker_invites (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  created_by uuid references profiles(id) on delete set null,
  used_by    uuid references profiles(id) on delete set null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- RLS
-- =====================================================================
alter table profiles       enable row level security;
alter table dogs           enable row level security;
alter table plans          enable row level security;
alter table subscriptions  enable row level security;
alter table schedule_rules enable row level security;
alter table appointments   enable row level security;
alter table walks          enable row level security;
alter table walk_positions enable row level security;
alter table reviews        enable row level security;
alter table announcements  enable row level security;
alter table payments       enable row level security;
alter table walker_invites enable row level security;

-- ---------- PROFILES ----------
create policy profiles_select_self_or_admin on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on profiles
  for update using (id = auth.uid());
create policy profiles_admin_all on profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- DOGS ----------
create policy dogs_owner_all on dogs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy dogs_admin_all on dogs
  for all using (public.is_admin()) with check (public.is_admin());
-- El paseador puede VER los perros que tiene asignados en turnos
create policy dogs_walker_select on dogs
  for select using (
    exists (select 1 from appointments a where a.dog_id = dogs.id and a.walker_id = auth.uid())
  );

-- ---------- PLANS (catálogo público de lectura; admin escribe) ----------
create policy plans_select_all on plans
  for select using (true);
create policy plans_admin_write on plans
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- SUBSCRIPTIONS ----------
create policy subs_owner on subscriptions
  for all using (
    exists (select 1 from dogs d where d.id = subscriptions.dog_id and d.owner_id = auth.uid())
  ) with check (
    exists (select 1 from dogs d where d.id = subscriptions.dog_id and d.owner_id = auth.uid())
  );
create policy subs_admin on subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- SCHEDULE RULES ----------
create policy rules_owner on schedule_rules
  for all using (
    exists (
      select 1 from subscriptions s join dogs d on d.id = s.dog_id
      where s.id = schedule_rules.subscription_id and d.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from subscriptions s join dogs d on d.id = s.dog_id
      where s.id = schedule_rules.subscription_id and d.owner_id = auth.uid()
    )
  );
create policy rules_admin on schedule_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- APPOINTMENTS ----------
create policy appts_owner_select on appointments
  for select using (
    exists (select 1 from dogs d where d.id = appointments.dog_id and d.owner_id = auth.uid())
  );
create policy appts_walker_select on appointments
  for select using (walker_id = auth.uid());
create policy appts_walker_update on appointments
  for update using (walker_id = auth.uid());
create policy appts_admin on appointments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- WALKS ----------
create policy walks_owner_select on walks
  for select using (
    exists (select 1 from dogs d where d.id = walks.dog_id and d.owner_id = auth.uid())
  );
create policy walks_walker_all on walks
  for all using (walker_id = auth.uid()) with check (walker_id = auth.uid());
create policy walks_admin on walks
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- WALK POSITIONS ----------
create policy positions_walker_insert on walk_positions
  for insert with check (
    exists (select 1 from walks w where w.id = walk_positions.walk_id and w.walker_id = auth.uid())
  );
create policy positions_select on walk_positions
  for select using (
    exists (
      select 1 from walks w
      where w.id = walk_positions.walk_id
        and (
          w.walker_id = auth.uid()
          or exists (select 1 from dogs d where d.id = w.dog_id and d.owner_id = auth.uid())
          or public.is_admin()
        )
    )
  );

-- ---------- REVIEWS (privadas) ----------
create policy reviews_client_insert on reviews
  for insert with check (client_id = auth.uid());
create policy reviews_admin_select on reviews
  for select using (public.is_admin());

-- ---------- ANNOUNCEMENTS ----------
create policy ann_select_active on announcements
  for select using (active = true or public.is_admin());
create policy ann_admin_write on announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- PAYMENTS ----------
create policy payments_owner_select on payments
  for select using (
    exists (
      select 1 from subscriptions s join dogs d on d.id = s.dog_id
      where s.id = payments.subscription_id and d.owner_id = auth.uid()
    )
  );
create policy payments_admin on payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- WALKER INVITES (solo admin) ----------
create policy invites_admin on walker_invites
  for all using (public.is_admin()) with check (public.is_admin());
