-- ============================================================
-- TRYM — Sprint 1: Auth + Profiles
-- Rodar no Supabase SQL Editor (Settings > SQL Editor)
-- ============================================================

-- 1. Enums
do $$ begin
  create type user_role as enum ('customer', 'professional', 'admin');
exception when duplicate_object then null; end $$;

-- 2. Tabela profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  phone       text,
  avatar_url  text,
  role        user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. Trigger: cria profile automaticamente ao criar usuário no Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- 5. RLS — Row Level Security
alter table public.profiles enable row level security;

-- Usuário lê e edita apenas o próprio perfil
drop policy if exists "profiles: owner read"   on public.profiles;
drop policy if exists "profiles: owner update" on public.profiles;

create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin TRYM pode ler todos
create policy "profiles: admin read"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 6. Índices
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_role_idx  on public.profiles(role);

-- ============================================================
-- Verificação
-- ============================================================
select 'profiles table OK' as status, count(*) as rows from public.profiles;
