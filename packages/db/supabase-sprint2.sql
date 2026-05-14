-- ============================================================
-- TRYM — Sprint 2: Venue + Serviços
-- Rodar no Supabase SQL Editor
-- ============================================================

-- 1. Enums adicionais
do $$ begin
  create type venue_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

-- 2. Categories
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  icon          text,
  display_order int default 0,
  is_active     boolean not null default true
);

-- 3. Subcategories
create table if not exists public.subcategories (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories(id) on delete cascade,
  slug          text not null,
  name          text not null,
  display_order int default 0,
  unique (category_id, slug)
);

-- 4. Venues
create table if not exists public.venues (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  category_id         uuid not null references public.categories(id),
  name                text not null,
  slug                text not null unique,
  description         text,
  cover_image_url     text,
  address_line        text,
  city                text,
  state               text,
  postal_code         text,
  country             text default 'BR',
  latitude            numeric(10,7),
  longitude           numeric(10,7),
  cnpj                text,
  phone               text,
  whatsapp            text,
  accepts_in_app_payment boolean default false,
  attributes          jsonb default '{}',
  status              venue_status not null default 'pending',
  is_featured         boolean default false,
  rating_average      numeric(2,1) default 0,
  rating_count        int default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists venues_owner_id_idx    on public.venues(owner_id);
create index if not exists venues_category_id_idx on public.venues(category_id);
create index if not exists venues_status_idx      on public.venues(status);

-- 5. Services
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  venue_id         uuid not null references public.venues(id) on delete cascade,
  subcategory_id   uuid references public.subcategories(id),
  name             text not null,
  description      text,
  duration_minutes int not null,
  price_cents      int not null,
  is_active        boolean not null default true,
  display_order    int default 0,
  attributes       jsonb default '{}',
  created_at       timestamptz not null default now()
);

create index if not exists services_venue_id_idx on public.services(venue_id);

-- 6. Business Hours
create table if not exists public.business_hours (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  day_of_week int not null, -- 0=Dom, 1=Seg, ..., 6=Sáb
  open_time   time,
  close_time  time,
  is_closed   boolean not null default false,
  unique (venue_id, day_of_week)
);

-- 7. updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists venues_updated_at on public.venues;
create trigger venues_updated_at
  before update on public.venues
  for each row execute procedure public.set_updated_at();

-- 8. Auto-insert default business hours when venue is created
create or replace function public.init_business_hours()
returns trigger language plpgsql security definer as $$
begin
  insert into public.business_hours (venue_id, day_of_week, open_time, close_time, is_closed)
  values
    (new.id, 0, '09:00', '18:00', true),   -- Domingo: fechado
    (new.id, 1, '09:00', '18:00', false),  -- Segunda
    (new.id, 2, '09:00', '18:00', false),  -- Terça
    (new.id, 3, '09:00', '18:00', false),  -- Quarta
    (new.id, 4, '09:00', '18:00', false),  -- Quinta
    (new.id, 5, '09:00', '18:00', false),  -- Sexta
    (new.id, 6, '09:00', '14:00', false)   -- Sábado: meio período
  on conflict (venue_id, day_of_week) do nothing;
  return new;
end $$;

drop trigger if exists on_venue_created on public.venues;
create trigger on_venue_created
  after insert on public.venues
  for each row execute procedure public.init_business_hours();

-- 9. RLS
alter table public.categories    enable row level security;
alter table public.subcategories enable row level security;
alter table public.venues        enable row level security;
alter table public.services      enable row level security;
alter table public.business_hours enable row level security;

-- Categories & subcategories: leitura pública
drop policy if exists "categories: public read"    on public.categories;
drop policy if exists "subcategories: public read" on public.subcategories;
create policy "categories: public read"    on public.categories    for select using (true);
create policy "subcategories: public read" on public.subcategories for select using (true);

-- Venues: owner faz tudo; leitura pública se ativo
drop policy if exists "venues: owner all"    on public.venues;
drop policy if exists "venues: public read"  on public.venues;
create policy "venues: owner all"
  on public.venues for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
create policy "venues: public read"
  on public.venues for select
  using (status = 'active');

-- Services: owner do venue faz tudo; leitura pública se venue ativo
drop policy if exists "services: owner all"   on public.services;
drop policy if exists "services: public read" on public.services;
create policy "services: owner all"
  on public.services for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));
create policy "services: public read"
  on public.services for select
  using (exists (select 1 from public.venues v where v.id = venue_id and v.status = 'active'));

-- Business hours: owner do venue faz tudo; leitura pública
drop policy if exists "business_hours: owner all"   on public.business_hours;
drop policy if exists "business_hours: public read" on public.business_hours;
create policy "business_hours: owner all"
  on public.business_hours for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));
create policy "business_hours: public read"
  on public.business_hours for select using (true);

-- 10. Seed: Categories
insert into public.categories (slug, name, icon, display_order) values
  ('beleza',  'Beleza',  '✂️', 1),
  ('pet',     'Pet',     '🐾', 2),
  ('fitness', 'Fitness', '💪', 3)
on conflict (slug) do nothing;

-- 11. Seed: Subcategories
insert into public.subcategories (category_id, slug, name, display_order)
select c.id, s.slug, s.name, s.ord from public.categories c
join (values
  ('beleza','cabelo',        'Cabelo',          1),
  ('beleza','unhas',         'Unhas',           2),
  ('beleza','sobrancelha',   'Sobrancelha/Cílios',3),
  ('beleza','estetica',      'Estética',        4),
  ('beleza','maquiagem',     'Maquiagem',       5),
  ('beleza','barbearia',     'Barbearia',       6),
  ('beleza','depilacao',     'Depilação',       7),
  ('pet','banho-tosa',       'Banho & Tosa',    1),
  ('pet','veterinario',      'Veterinário',     2),
  ('pet','adestramento',     'Adestramento',    3),
  ('pet','hotel-pet',        'Hotel Pet',       4),
  ('fitness','personal',     'Personal Trainer',1),
  ('fitness','yoga-pilates', 'Yoga / Pilates',  2),
  ('fitness','musculacao',   'Musculação',      3),
  ('fitness','crossfit',     'Crossfit',        4),
  ('fitness','natacao',      'Natação',         5)
) as s(cat_slug, slug, name, ord) on c.slug = s.cat_slug
on conflict (category_id, slug) do nothing;

-- Verificação
select 'categories' as tbl, count(*) from public.categories
union all
select 'subcategories', count(*) from public.subcategories;
