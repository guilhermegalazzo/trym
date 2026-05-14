-- ============================================================
-- TRYM — Sprint 2.5: Schema Completo + RLS Production-Grade
-- Rodar no Supabase SQL Editor (projeto ijdjugpzuahmxsquzovj)
--
-- O que este script faz:
--   1. Novos enums (appointment_status, subscription_status)
--   2. Colunas faltando na tabela venues
--   3. Índice de geolocalização em venues
--   4. 19 tabelas novas (equipe, agenda, caixa, assinatura, etc.)
--   5. RLS completo e production-grade em todas as tabelas
--   6. Trigger: subscription trial automática ao criar venue
--   7. Backfill: subscriptions para venues já existentes
--   8. Verificação final (contagem de tabelas)
-- ============================================================

-- ─── 1. Novos enums ───────────────────────────────────────────────────────────

do $$ begin
  create type appointment_status as enum (
    'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum (
    'trialing', 'active', 'past_due', 'read_only', 'cancelled'
  );
exception when duplicate_object then null; end $$;

-- ─── 2. ALTER TABLE venues — colunas faltando ────────────────────────────────

alter table public.venues
  add column if not exists gallery_urls            text[],
  add column if not exists mercadopago_account_id  text,
  add column if not exists whatsapp_business_connected       boolean default false,
  add column if not exists whatsapp_business_phone_id        text,
  add column if not exists whatsapp_business_token_encrypted text,
  add column if not exists featured_until          timestamptz;

-- ─── 3. Índice de geolocalização (faltava) ────────────────────────────────────

create index if not exists venues_location_idx on public.venues (latitude, longitude);

-- ─── 4. Team Members ─────────────────────────────────────────────────────────

create table if not exists public.team_members (
  id                   uuid primary key default gen_random_uuid(),
  venue_id             uuid not null references public.venues(id) on delete cascade,
  profile_id           uuid references public.profiles(id) on delete set null,
  display_name         text not null,
  bio                  text,
  avatar_url           text,
  role                 text,
  commission_percentage numeric(5,2) default 0,
  is_active            boolean not null default true,
  display_order        int default 0
);

create index if not exists team_members_venue_id_idx on public.team_members (venue_id);

-- ─── 5. Team Member Services (pivot) ─────────────────────────────────────────

create table if not exists public.team_member_services (
  team_member_id              uuid not null references public.team_members(id) on delete cascade,
  service_id                  uuid not null references public.services(id) on delete cascade,
  commission_percentage_override numeric(5,2),
  primary key (team_member_id, service_id)
);

-- ─── 6. Team Member Hours ─────────────────────────────────────────────────────

create table if not exists public.team_member_hours (
  id             uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  day_of_week    int not null,
  start_time     time,
  end_time       time,
  is_off         boolean default false,
  unique (team_member_id, day_of_week)
);

-- ─── 7. Products (PDV) ───────────────────────────────────────────────────────

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references public.venues(id) on delete cascade,
  name           text not null,
  sku            text,
  price_cents    int not null,
  cost_cents     int default 0,
  stock_quantity int default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists products_venue_id_idx on public.products (venue_id);

-- ─── 8. Schedule Blocks (bloqueios de agenda) ─────────────────────────────────

create table if not exists public.schedule_blocks (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references public.venues(id) on delete cascade,
  team_member_id uuid references public.team_members(id) on delete set null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  reason         text,
  is_recurring   boolean default false,
  created_at     timestamptz not null default now()
);

create index if not exists schedule_blocks_venue_id_idx    on public.schedule_blocks (venue_id);
create index if not exists schedule_blocks_starts_at_idx   on public.schedule_blocks (starts_at);

-- ─── 9. Venue Customers (ficha do cliente no venue) ──────────────────────────

create table if not exists public.venue_customers (
  id                 uuid primary key default gen_random_uuid(),
  venue_id           uuid not null references public.venues(id) on delete cascade,
  profile_id         uuid references public.profiles(id) on delete set null,
  full_name          text not null,
  phone              text,
  email              text,
  birth_date         date,
  total_spent_cents  int default 0,
  visit_count        int default 0,
  last_visit_at      timestamptz,
  private_notes      text,
  tags               text[] default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists venue_customers_venue_id_idx    on public.venue_customers (venue_id);
create index if not exists venue_customers_profile_id_idx  on public.venue_customers (profile_id);
-- Unique: mesmo profile não pode ser duplicado no mesmo venue
create unique index if not exists venue_customers_venue_profile_idx
  on public.venue_customers (venue_id, profile_id)
  where profile_id is not null;

-- ─── 10. Appointments ─────────────────────────────────────────────────────────

create table if not exists public.appointments (
  id                    uuid primary key default gen_random_uuid(),
  venue_id              uuid not null references public.venues(id),
  venue_customer_id     uuid not null references public.venue_customers(id),
  team_member_id        uuid references public.team_members(id),
  source                text not null default 'manual', -- 'marketplace' | 'manual' | 'walk_in'
  status                appointment_status not null default 'confirmed',
  scheduled_at          timestamptz not null,
  duration_minutes      int not null,
  total_cents           int not null default 0,
  payment_method        text,    -- 'in_app' | 'cash' | 'pix' | 'debit' | 'credit' | 'on_credit'
  payment_status        text default 'pending', -- 'pending' | 'paid' | 'refunded'
  mercadopago_payment_id text,
  customer_notes        text,
  internal_notes        text,
  cancelled_at          timestamptz,
  cancellation_reason   text,
  created_at            timestamptz not null default now(),
  created_by            uuid references public.profiles(id)
);

create index if not exists appointments_venue_id_idx        on public.appointments (venue_id);
create index if not exists appointments_customer_id_idx     on public.appointments (venue_customer_id);
create index if not exists appointments_scheduled_at_idx    on public.appointments (scheduled_at);
create index if not exists appointments_status_idx          on public.appointments (status);
create index if not exists appointments_venue_date_idx      on public.appointments (venue_id, scheduled_at);

-- ─── 11. Appointment Items (itens da comanda) ─────────────────────────────────

create table if not exists public.appointment_items (
  id                    uuid primary key default gen_random_uuid(),
  appointment_id        uuid not null references public.appointments(id) on delete cascade,
  service_id            uuid references public.services(id),
  product_id            uuid references public.products(id),
  description           text not null,
  quantity              int default 1,
  unit_price_cents      int not null,
  total_cents           int not null,
  team_member_id        uuid references public.team_members(id),
  commission_percentage numeric(5,2),
  commission_cents      int default 0,
  constraint appointment_items_service_or_product
    check (service_id is not null or product_id is not null)
);

create index if not exists appointment_items_appointment_id_idx on public.appointment_items (appointment_id);

-- ─── 12. Cash Register Sessions (abertura/fechamento de caixa) ───────────────

create table if not exists public.cash_register_sessions (
  id                    uuid primary key default gen_random_uuid(),
  venue_id              uuid not null references public.venues(id) on delete cascade,
  opened_by             uuid not null references public.profiles(id),
  opened_at             timestamptz not null default now(),
  opening_amount_cents  int not null default 0,
  closed_at             timestamptz,
  closed_by             uuid references public.profiles(id),
  closing_amount_cents  int,
  expected_amount_cents int,
  difference_cents      int,
  notes                 text
);

create index if not exists cash_sessions_venue_id_idx on public.cash_register_sessions (venue_id);
create index if not exists cash_sessions_opened_at_idx on public.cash_register_sessions (opened_at);

-- ─── 13. Cash Transactions ────────────────────────────────────────────────────

create table if not exists public.cash_transactions (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.cash_register_sessions(id) on delete cascade,
  appointment_id uuid references public.appointments(id),
  type           text not null, -- 'sale' | 'refund' | 'sangria' | 'suprimento'
  payment_method text not null, -- 'cash' | 'pix' | 'debit' | 'credit'
  amount_cents   int not null,
  description    text,
  created_at     timestamptz not null default now(),
  created_by     uuid references public.profiles(id)
);

create index if not exists cash_transactions_session_id_idx on public.cash_transactions (session_id);

-- ─── 14. Commission Periods (Pro) ─────────────────────────────────────────────

create table if not exists public.commission_periods (
  id                    uuid primary key default gen_random_uuid(),
  venue_id              uuid not null references public.venues(id) on delete cascade,
  team_member_id        uuid not null references public.team_members(id) on delete cascade,
  period_start          date not null,
  period_end            date not null,
  total_services_cents  int default 0,
  total_commission_cents int default 0,
  status                text default 'open', -- 'open' | 'closed' | 'paid'
  closed_at             timestamptz,
  paid_at               timestamptz,
  notes                 text
);

create index if not exists commission_periods_venue_member_idx
  on public.commission_periods (venue_id, team_member_id);

-- ─── 15. Reviews ──────────────────────────────────────────────────────────────

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null unique references public.appointments(id),
  customer_id     uuid not null references public.profiles(id),
  venue_id        uuid not null references public.venues(id),
  rating          int not null constraint reviews_rating_check check (rating between 1 and 5),
  comment         text,
  venue_reply     text,
  venue_replied_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists reviews_venue_id_idx on public.reviews (venue_id);

-- ─── 16. Favorites ────────────────────────────────────────────────────────────

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  venue_id    uuid not null references public.venues(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (customer_id, venue_id)
);

-- ─── 17. Subscriptions (SaaS) ─────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  venue_id                  uuid not null unique references public.venues(id) on delete cascade,
  status                    subscription_status not null,
  plan                      text not null default 'basic', -- 'basic' | 'pro'
  trial_ends_at             timestamptz,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  mercadopago_preapproval_id text,
  cancelled_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ─── 18. Subscription Invoices ────────────────────────────────────────────────

create table if not exists public.subscription_invoices (
  id                    uuid primary key default gen_random_uuid(),
  subscription_id       uuid not null references public.subscriptions(id) on delete cascade,
  amount_cents          int not null,
  status                text, -- 'paid' | 'failed' | 'pending'
  paid_at               timestamptz,
  mercadopago_payment_id text,
  created_at            timestamptz not null default now()
);

-- ─── 19. Notifications ────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  data       jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_read_at_idx on public.notifications (user_id, read_at)
  where read_at is null;

-- ─── 20. Push Tokens ──────────────────────────────────────────────────────────

create table if not exists public.push_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  device_id       text,
  platform        text, -- 'ios' | 'android'
  created_at      timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

-- ─── 21. WhatsApp Messages (Pro) ──────────────────────────────────────────────

create table if not exists public.whatsapp_messages (
  id                uuid primary key default gen_random_uuid(),
  venue_id          uuid not null references public.venues(id) on delete cascade,
  venue_customer_id uuid not null references public.venue_customers(id),
  appointment_id    uuid references public.appointments(id),
  direction         text not null, -- 'outbound' | 'inbound'
  template_name     text,
  body              text,
  status            text, -- 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  external_id       text,
  error_message     text,
  created_at        timestamptz not null default now()
);

create index if not exists whatsapp_messages_venue_id_idx    on public.whatsapp_messages (venue_id);
create index if not exists whatsapp_messages_customer_id_idx on public.whatsapp_messages (venue_customer_id);

-- ─── 22. WhatsApp Templates (Pro) ─────────────────────────────────────────────

create table if not exists public.whatsapp_templates (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  name        text not null,
  category    text, -- 'reminder' | 'confirmation' | 'marketing'
  body        text not null,
  variables   text[] default '{}',
  is_approved boolean default false,
  created_at  timestamptz not null default now()
);

-- ─── 23. updated_at triggers (novas tabelas) ──────────────────────────────────

-- Reutiliza a função set_updated_at criada no Sprint 2

drop trigger if exists venue_customers_updated_at on public.venue_customers;
create trigger venue_customers_updated_at
  before update on public.venue_customers
  for each row execute procedure public.set_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ─── 24. RLS — habilitar em todas as novas tabelas ────────────────────────────

alter table public.team_members          enable row level security;
alter table public.team_member_services  enable row level security;
alter table public.team_member_hours     enable row level security;
alter table public.products              enable row level security;
alter table public.schedule_blocks       enable row level security;
alter table public.venue_customers       enable row level security;
alter table public.appointments          enable row level security;
alter table public.appointment_items     enable row level security;
alter table public.cash_register_sessions enable row level security;
alter table public.cash_transactions     enable row level security;
alter table public.commission_periods    enable row level security;
alter table public.reviews               enable row level security;
alter table public.favorites             enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.subscription_invoices enable row level security;
alter table public.notifications         enable row level security;
alter table public.push_tokens           enable row level security;
alter table public.whatsapp_messages     enable row level security;
alter table public.whatsapp_templates    enable row level security;

-- ─── 24a. RLS: team_members ───────────────────────────────────────────────────

drop policy if exists "team_members: owner all"   on public.team_members;
drop policy if exists "team_members: public read" on public.team_members;

create policy "team_members: owner all" on public.team_members
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

create policy "team_members: public read" on public.team_members
  for select
  using (
    is_active = true and
    exists (select 1 from public.venues v where v.id = venue_id and v.status = 'active')
  );

-- ─── 24b. RLS: team_member_services ──────────────────────────────────────────

drop policy if exists "team_member_services: owner all" on public.team_member_services;
drop policy if exists "team_member_services: public read" on public.team_member_services;

create policy "team_member_services: owner all" on public.team_member_services
  for all
  using (exists (
    select 1 from public.team_members tm
    join public.venues v on v.id = tm.venue_id
    where tm.id = team_member_id and v.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.team_members tm
    join public.venues v on v.id = tm.venue_id
    where tm.id = team_member_id and v.owner_id = auth.uid()
  ));

create policy "team_member_services: public read" on public.team_member_services
  for select using (true);

-- ─── 24c. RLS: team_member_hours ─────────────────────────────────────────────

drop policy if exists "team_member_hours: owner all"  on public.team_member_hours;
drop policy if exists "team_member_hours: public read" on public.team_member_hours;

create policy "team_member_hours: owner all" on public.team_member_hours
  for all
  using (exists (
    select 1 from public.team_members tm
    join public.venues v on v.id = tm.venue_id
    where tm.id = team_member_id and v.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.team_members tm
    join public.venues v on v.id = tm.venue_id
    where tm.id = team_member_id and v.owner_id = auth.uid()
  ));

create policy "team_member_hours: public read" on public.team_member_hours
  for select using (true);

-- ─── 24d. RLS: products ───────────────────────────────────────────────────────

drop policy if exists "products: owner all" on public.products;

create policy "products: owner all" on public.products
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- ─── 24e. RLS: schedule_blocks ────────────────────────────────────────────────

drop policy if exists "schedule_blocks: owner all" on public.schedule_blocks;

create policy "schedule_blocks: owner all" on public.schedule_blocks
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- ─── 24f. RLS: venue_customers ────────────────────────────────────────────────

drop policy if exists "venue_customers: owner all"    on public.venue_customers;
drop policy if exists "venue_customers: self read"    on public.venue_customers;

create policy "venue_customers: owner all" on public.venue_customers
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- Customer pode ver sua própria ficha em qualquer venue
create policy "venue_customers: self read" on public.venue_customers
  for select
  using (profile_id = auth.uid());

-- ─── 24g. RLS: appointments ───────────────────────────────────────────────────

drop policy if exists "appointments: owner all"     on public.appointments;
drop policy if exists "appointments: customer read" on public.appointments;

create policy "appointments: owner all" on public.appointments
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

create policy "appointments: customer read" on public.appointments
  for select
  using (exists (
    select 1 from public.venue_customers vc
    where vc.id = venue_customer_id and vc.profile_id = auth.uid()
  ));

-- ─── 24h. RLS: appointment_items ──────────────────────────────────────────────

drop policy if exists "appointment_items: owner all"     on public.appointment_items;
drop policy if exists "appointment_items: customer read" on public.appointment_items;

create policy "appointment_items: owner all" on public.appointment_items
  for all
  using (exists (
    select 1 from public.appointments a
    join public.venues v on v.id = a.venue_id
    where a.id = appointment_id and v.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.appointments a
    join public.venues v on v.id = a.venue_id
    where a.id = appointment_id and v.owner_id = auth.uid()
  ));

create policy "appointment_items: customer read" on public.appointment_items
  for select
  using (exists (
    select 1 from public.appointments a
    join public.venue_customers vc on vc.id = a.venue_customer_id
    where a.id = appointment_id and vc.profile_id = auth.uid()
  ));

-- ─── 24i. RLS: cash_register_sessions ────────────────────────────────────────

drop policy if exists "cash_register_sessions: owner all" on public.cash_register_sessions;

create policy "cash_register_sessions: owner all" on public.cash_register_sessions
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- ─── 24j. RLS: cash_transactions ─────────────────────────────────────────────

drop policy if exists "cash_transactions: owner all" on public.cash_transactions;

create policy "cash_transactions: owner all" on public.cash_transactions
  for all
  using (exists (
    select 1 from public.cash_register_sessions s
    join public.venues v on v.id = s.venue_id
    where s.id = session_id and v.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.cash_register_sessions s
    join public.venues v on v.id = s.venue_id
    where s.id = session_id and v.owner_id = auth.uid()
  ));

-- ─── 24k. RLS: commission_periods ────────────────────────────────────────────

drop policy if exists "commission_periods: owner all" on public.commission_periods;

create policy "commission_periods: owner all" on public.commission_periods
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- ─── 24l. RLS: reviews ────────────────────────────────────────────────────────

drop policy if exists "reviews: public read"    on public.reviews;
drop policy if exists "reviews: customer insert" on public.reviews;
drop policy if exists "reviews: owner reply"    on public.reviews;

create policy "reviews: public read" on public.reviews
  for select using (true);

create policy "reviews: customer insert" on public.reviews
  for insert
  with check (
    customer_id = auth.uid() and
    exists (
      select 1 from public.appointments a
      join public.venue_customers vc on vc.id = a.venue_customer_id
      where a.id = appointment_id
        and a.status = 'completed'
        and vc.profile_id = auth.uid()
    )
  );

create policy "reviews: owner reply" on public.reviews
  for update
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- ─── 24m. RLS: favorites ──────────────────────────────────────────────────────

drop policy if exists "favorites: customer all" on public.favorites;

create policy "favorites: customer all" on public.favorites
  for all
  using  (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- ─── 24n. RLS: subscriptions ──────────────────────────────────────────────────

drop policy if exists "subscriptions: owner read" on public.subscriptions;

create policy "subscriptions: owner read" on public.subscriptions
  for select
  using (exists (
    select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()
  ));

-- Write via service_role / Edge Functions apenas — sem policy de escrita para usuários

-- ─── 24o. RLS: subscription_invoices ─────────────────────────────────────────

drop policy if exists "subscription_invoices: owner read" on public.subscription_invoices;

create policy "subscription_invoices: owner read" on public.subscription_invoices
  for select
  using (exists (
    select 1 from public.subscriptions s
    join public.venues v on v.id = s.venue_id
    where s.id = subscription_id and v.owner_id = auth.uid()
  ));

-- ─── 24p. RLS: notifications ──────────────────────────────────────────────────

drop policy if exists "notifications: user read"   on public.notifications;
drop policy if exists "notifications: user update" on public.notifications;

create policy "notifications: user read" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications: user update" on public.notifications
  for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── 24q. RLS: push_tokens ────────────────────────────────────────────────────

drop policy if exists "push_tokens: user all" on public.push_tokens;

create policy "push_tokens: user all" on public.push_tokens
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── 24r. RLS: whatsapp_messages ─────────────────────────────────────────────

drop policy if exists "whatsapp_messages: owner all" on public.whatsapp_messages;

create policy "whatsapp_messages: owner all" on public.whatsapp_messages
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- ─── 24s. RLS: whatsapp_templates ────────────────────────────────────────────

drop policy if exists "whatsapp_templates: owner all" on public.whatsapp_templates;

create policy "whatsapp_templates: owner all" on public.whatsapp_templates
  for all
  using  (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));

-- ─── 25. Trigger: criar subscription trial ao criar venue ────────────────────

create or replace function public.create_trial_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (venue_id, status, plan, trial_ends_at)
  values (new.id, 'trialing', 'basic', now() + interval '14 days')
  on conflict (venue_id) do nothing;
  return new;
end $$;

drop trigger if exists on_venue_created_subscription on public.venues;
create trigger on_venue_created_subscription
  after insert on public.venues
  for each row execute procedure public.create_trial_subscription();

-- ─── 26. Backfill: subscriptions para venues já existentes ───────────────────

insert into public.subscriptions (venue_id, status, plan, trial_ends_at)
select id, 'trialing', 'basic', now() + interval '14 days'
from public.venues
on conflict (venue_id) do nothing;

-- ─── 27. Verificação final ────────────────────────────────────────────────────

select
  table_name,
  (select count(*) from information_schema.columns
   where table_schema = 'public' and columns.table_name = t.table_name) as col_count
from information_schema.tables t
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;
