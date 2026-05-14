# 📘 SPEC MASTER — TRYM (v2.0)

> **Documento autoritativo do projeto.** Tudo que o Claude Code precisa saber pra construir o produto está aqui.
> Versão: 2.0 — Maio 2026
> Owner: Guilherme Galazzo

---

## 1. Visão do Produto

### 1.1 O que é
**TRYM** é uma plataforma híbrida **SaaS + Marketplace** de serviços multi-nicho para o Brasil. Combina:

1. **Sistema operacional completo** para profissionais autônomos e estabelecimentos (agenda, PDV, caixa, comissões, financeiro, equipe, clientes) — substitui Trinks, Belezzia, planilha do Excel.
2. **Marketplace de descoberta** — clientes encontram profissionais pelo app mobile e agendam direto.

**Nichos iniciais**: Beleza, Pet, Fitness.

### 1.2 Estratégia de negócio
O Fresha (EUA) provou: **vender o SaaS primeiro, o marketplace vem de brinde**. Profissional não cancela porque o sistema é onde toda a operação dele vive.

- **Hook de aquisição**: "Organize sua agenda e ganhe clientes novos."
- **Retenção**: dados de clientes, histórico financeiro e comissões ficam no TRYM. Sair = perder tudo.
- **Expansão**: cliente do plano Básico vira Pro quando cresce a equipe / quer relatórios / quer WhatsApp.

### 1.3 Lados do produto
- **Cliente final** — App mobile (iOS + Android via Expo). Descobre, agenda, paga e avalia.
- **Profissional / Estabelecimento** — Painel web responsivo. **É o sistema operacional do negócio**, não só um cadastro.
- **Admin (operação TRYM)** — Painel web (mesma base do profissional, com permissões superiores).

### 1.4 Diferenciais vs. concorrentes (Trinks, Booksy, Belezzia)
1. **Multi-nicho desde o dia 1**.
2. **Preço agressivo**: R$ 29,90 (Básico) vs. Trinks R$ 79+.
3. **UX premium**, padrão Apple Store.
4. **Trial 30 dias sem cartão**.
5. **WhatsApp nativo** desde o MVP (Trinks cobra à parte).
6. **Marketplace integrado** — concorrentes só vendem o sistema, não trazem clientes.

### 1.5 Métricas Norte
- **Activated Pros**: cadastro + 1º serviço publicado + 1º agendamento criado.
- **Paid Pros**: conversão pós-trial.
- **Plan upgrade rate**: % de Básico que vira Pro em 90 dias.
- **GMV transacionado** (todos os atendimentos, mesmo em dinheiro).
- **Bookings via marketplace** vs. bookings manuais (sinaliza valor do app cliente pro pro).

---

## 2. Stack Técnica Definitiva

### 2.1 App mobile (cliente)
| Camada | Tecnologia |
|---|---|
| Framework | **React Native + Expo SDK 52+** |
| Linguagem | **TypeScript strict** |
| Routing | **Expo Router v4** |
| Server state | **TanStack Query v5** |
| Client state | **Zustand** |
| Styling | **NativeWind v4** |
| Forms | **React Hook Form + Zod** |
| Mapas | **react-native-maps** |
| Push | **Expo Notifications** |
| Imagens | **expo-image** |

### 2.2 Painel web (profissional + admin)
| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 15 (App Router)** |
| Linguagem | **TypeScript strict** |
| UI | **shadcn/ui + Tailwind v4** |
| Server state | **TanStack Query v5** |
| Forms | **React Hook Form + Zod** |
| Charts | **Recharts** |
| Tabelas | **TanStack Table v8** |
| Calendário | **FullCalendar** (resource view pra equipe) |
| Deploy | **Vercel** |

### 2.3 Backend & Infra
| Serviço | Uso |
|---|---|
| **Supabase** | Postgres + Auth + Storage + Realtime + Edge Functions |
| **Drizzle ORM** | Migrations versionadas, schema typesafe |
| **Mercado Pago** | Checkout transparente (booking) + Preapproval (subscription) |
| **WhatsApp Business API** | Via **Z-API** ou **Meta Cloud API** (decidir no Sprint 7) |
| **Resend** | E-mails transacionais |
| **Expo Notifications** | Push iOS + Android |
| **Sentry** | Error tracking |
| **PostHog** | Product analytics |

### 2.4 Monorepo
```
trym/
├── apps/
│   ├── mobile/          # Expo app (cliente)
│   └── web/             # Next.js (painel pro + admin)
├── packages/
│   ├── ui/              # Componentes compartilhados quando possível
│   ├── db/              # Drizzle schema + migrations
│   ├── api/             # Tipos compartilhados, schemas Zod
│   ├── config/          # ESLint, TS, Tailwind configs
│   └── utils/           # Helpers (formatação BR, datas, BRL, CPF/CNPJ)
├── package.json         # pnpm workspaces
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 3. Estrutura de Planos

### 3.1 Plano Básico — R$ 29,90/mês
- Trial 30 dias sem cartão
- Agenda visual completa
- Cadastro ilimitado de clientes
- Cadastro de serviços e equipe (até **3 profissionais**)
- PDV simples (comanda + fechamento)
- Caixa diário (abertura/fechamento)
- Aparição no marketplace
- Pagamento via app (Mercado Pago)
- Lembretes por push e e-mail
- 1 unidade

### 3.2 Plano Pro — R$ 59,90/mês
Tudo do Básico, mais:
- Equipe **ilimitada**
- **Comissões automáticas** por profissional
- **WhatsApp nativo** (lembretes, confirmações, marketing)
- **Relatórios avançados** (faturamento por profissional/serviço/período, ticket médio, retenção)
- **Notas privadas do cliente** (ficha técnica, alergias, preferências)
- **Bloqueio inteligente** de horário com motivo
- Destaque "Featured" no marketplace por **3 dias/mês**
- Export de dados (CSV)

### 3.3 Add-ons (futuro v2)
- Múltiplas unidades: +R$ 19,90/unidade
- Boost no marketplace: R$ 49,90/semana

### 3.4 Regras de plano
- Downgrade Pro → Básico: features Pro ficam **read-only** por 30 dias antes de bloquear.
- Trial expirado sem cartão: sistema fica **read-only** por 7 dias (pode acessar e exportar dados, não pode criar nada novo), depois suspende.
- Boundary check no backend e UI: toda feature Pro tem `hasPlan('pro')` guard.

---

## 4. Schema do Banco (Postgres / Supabase)

> **Princípio**: schema multi-nicho desde o dia 1 + suporte completo a operação do estabelecimento. JSONB para atributos específicos por nicho.

### 4.1 Tabelas principais

```sql
-- ============ USUÁRIOS ============
profiles (
  id uuid PK references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  role user_role not null default 'customer', -- 'customer' | 'professional' | 'admin'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- ============ CATEGORIAS / NICHOS ============
categories (
  id uuid PK,
  slug text unique not null,
  name text not null,
  icon text,
  display_order int default 0,
  is_active boolean default true
)

subcategories (
  id uuid PK,
  category_id uuid FK -> categories,
  slug text not null,
  name text not null,
  display_order int default 0,
  unique(category_id, slug)
)

-- ============ VENUES (ESTABELECIMENTOS) ============
venues (
  id uuid PK,
  owner_id uuid FK -> profiles(id),
  category_id uuid FK -> categories,
  name text not null,
  slug text unique not null,
  description text,
  cover_image_url text,
  gallery_urls text[],
  -- Endereço
  address_line text,
  city text,
  state text,
  postal_code text,
  country text default 'BR',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  -- Negócio
  cnpj text,
  phone text,
  whatsapp text,
  -- Pagamento (do cliente para o venue)
  accepts_in_app_payment boolean default false,
  mercadopago_account_id text,
  -- WhatsApp Business
  whatsapp_business_connected boolean default false,
  whatsapp_business_phone_id text,
  whatsapp_business_token_encrypted text,
  -- Atributos por nicho
  attributes jsonb default '{}',
  -- Status
  status venue_status default 'pending', -- 'pending' | 'active' | 'suspended'
  is_featured boolean default false,
  featured_until timestamptz,
  rating_average numeric(2,1) default 0,
  rating_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- ============ EQUIPE ============
team_members (
  id uuid PK,
  venue_id uuid FK -> venues,
  profile_id uuid FK -> profiles, -- nulo se funcionário sem login
  display_name text not null,
  bio text,
  avatar_url text,
  role text, -- 'Barbeiro', 'Tosador', 'Personal'
  commission_percentage numeric(5,2) default 0, -- % padrão (sobrescrita por serviço)
  is_active boolean default true,
  display_order int default 0
)

-- Quais serviços cada membro executa
team_member_services (
  team_member_id uuid FK -> team_members,
  service_id uuid FK -> services,
  commission_percentage_override numeric(5,2), -- nulo = usa o padrão do membro
  PRIMARY KEY (team_member_id, service_id)
)

-- ============ SERVIÇOS ============
services (
  id uuid PK,
  venue_id uuid FK -> venues,
  subcategory_id uuid FK -> subcategories,
  name text not null,
  description text,
  duration_minutes int not null,
  price_cents int not null,
  is_active boolean default true,
  display_order int default 0,
  attributes jsonb default '{}',
  created_at timestamptz default now()
)

-- ============ PRODUTOS (vendidos no PDV) ============
products (
  id uuid PK,
  venue_id uuid FK -> venues,
  name text not null,
  sku text,
  price_cents int not null,
  cost_cents int default 0, -- pra margem
  stock_quantity int default 0, -- v2 controla, v1 só registra
  is_active boolean default true,
  created_at timestamptz default now()
)

-- ============ HORÁRIOS ============
business_hours (
  id uuid PK,
  venue_id uuid FK -> venues,
  day_of_week int not null, -- 0 (dom) a 6 (sáb)
  open_time time,
  close_time time,
  is_closed boolean default false,
  unique(venue_id, day_of_week)
)

team_member_hours (
  id uuid PK,
  team_member_id uuid FK -> team_members,
  day_of_week int not null,
  start_time time,
  end_time time,
  is_off boolean default false,
  unique(team_member_id, day_of_week)
)

schedule_blocks (
  id uuid PK,
  venue_id uuid FK -> venues,
  team_member_id uuid FK -> team_members nullable,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text, -- 'Almoço', 'Folga', 'Treinamento'
  is_recurring boolean default false,
  created_at timestamptz default now()
)

-- ============ CLIENTES DO VENUE ============
-- Clientes podem existir SEM ter conta no app (cadastro manual pelo pro)
venue_customers (
  id uuid PK,
  venue_id uuid FK -> venues,
  profile_id uuid FK -> profiles nullable, -- se cliente tem app, é vinculado
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  total_spent_cents int default 0,
  visit_count int default 0,
  last_visit_at timestamptz,
  -- Notas privadas (Plano Pro)
  private_notes text,
  -- Tags livres
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(venue_id, profile_id) -- 1 cliente por venue
)

-- ============ AGENDAMENTOS ============
appointments (
  id uuid PK,
  venue_id uuid FK -> venues,
  venue_customer_id uuid FK -> venue_customers, -- sempre preenchido
  team_member_id uuid FK -> team_members,
  -- Origem
  source text not null, -- 'marketplace' | 'manual' | 'walk_in'
  -- Status
  status appointment_status default 'confirmed',
  -- 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  scheduled_at timestamptz not null,
  duration_minutes int not null,
  total_cents int not null,
  -- Pagamento
  payment_method text, -- 'in_app' | 'cash' | 'pix' | 'debit' | 'credit' | 'on_credit' (fiado)
  payment_status text default 'pending', -- 'pending' | 'paid' | 'refunded' | 'partially_paid'
  mercadopago_payment_id text,
  -- Observações
  customer_notes text,
  internal_notes text, -- visível só pro venue
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz default now(),
  created_by uuid -- profile que criou (cliente do app OU funcionário do venue)
)

appointment_items (
  id uuid PK,
  appointment_id uuid FK -> appointments on delete cascade,
  -- Pode ser serviço OU produto
  service_id uuid FK -> services nullable,
  product_id uuid FK -> products nullable,
  description text not null, -- snapshot do nome
  quantity int default 1,
  unit_price_cents int not null, -- snapshot
  total_cents int not null,
  -- Comissão calculada (snapshot no momento)
  team_member_id uuid FK -> team_members, -- quem executou
  commission_percentage numeric(5,2),
  commission_cents int default 0,
  CHECK (service_id IS NOT NULL OR product_id IS NOT NULL)
)

-- ============ CAIXA (PDV) ============
cash_register_sessions (
  id uuid PK,
  venue_id uuid FK -> venues,
  opened_by uuid FK -> profiles,
  opened_at timestamptz default now(),
  opening_amount_cents int not null,
  closed_at timestamptz,
  closed_by uuid FK -> profiles,
  closing_amount_cents int,
  expected_amount_cents int, -- calculado das transações
  difference_cents int, -- closing - expected
  notes text
)

cash_transactions (
  id uuid PK,
  session_id uuid FK -> cash_register_sessions,
  appointment_id uuid FK -> appointments nullable, -- se veio de um atendimento
  type text not null, -- 'sale' | 'refund' | 'sangria' | 'suprimento'
  payment_method text not null, -- 'cash' | 'pix' | 'debit' | 'credit'
  amount_cents int not null,
  description text,
  created_at timestamptz default now(),
  created_by uuid FK -> profiles
)

-- ============ COMISSÕES (Plano Pro) ============
commission_periods (
  id uuid PK,
  venue_id uuid FK -> venues,
  team_member_id uuid FK -> team_members,
  period_start date not null,
  period_end date not null,
  total_services_cents int default 0,
  total_commission_cents int default 0,
  status text default 'open', -- 'open' | 'closed' | 'paid'
  closed_at timestamptz,
  paid_at timestamptz,
  notes text
)

-- ============ AVALIAÇÕES ============
reviews (
  id uuid PK,
  appointment_id uuid FK -> appointments unique,
  customer_id uuid FK -> profiles,
  venue_id uuid FK -> venues,
  rating int not null check (rating between 1 and 5),
  comment text,
  venue_reply text,
  venue_replied_at timestamptz,
  created_at timestamptz default now()
)

-- ============ FAVORITOS ============
favorites (
  id uuid PK,
  customer_id uuid FK -> profiles,
  venue_id uuid FK -> venues,
  created_at timestamptz default now(),
  unique(customer_id, venue_id)
)

-- ============ ASSINATURAS (SaaS TRYM) ============
subscriptions (
  id uuid PK,
  venue_id uuid FK -> venues unique,
  status subscription_status not null, -- 'trialing' | 'active' | 'past_due' | 'cancelled' | 'read_only'
  plan text not null, -- 'basic' | 'pro'
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  mercadopago_preapproval_id text,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

subscription_invoices (
  id uuid PK,
  subscription_id uuid FK -> subscriptions,
  amount_cents int not null,
  status text, -- 'paid' | 'failed' | 'pending'
  paid_at timestamptz,
  mercadopago_payment_id text,
  created_at timestamptz default now()
)

-- ============ NOTIFICAÇÕES ============
notifications (
  id uuid PK,
  user_id uuid FK -> profiles,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
)

push_tokens (
  id uuid PK,
  user_id uuid FK -> profiles,
  expo_push_token text not null,
  device_id text,
  platform text,
  created_at timestamptz default now(),
  unique(user_id, expo_push_token)
)

-- ============ WHATSAPP (Plano Pro) ============
whatsapp_messages (
  id uuid PK,
  venue_id uuid FK -> venues,
  venue_customer_id uuid FK -> venue_customers,
  appointment_id uuid FK -> appointments nullable,
  direction text not null, -- 'outbound' | 'inbound'
  template_name text, -- se foi template aprovado
  body text,
  status text, -- 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  external_id text, -- id no provedor
  error_message text,
  created_at timestamptz default now()
)

whatsapp_templates (
  id uuid PK,
  venue_id uuid FK -> venues,
  name text not null,
  category text, -- 'reminder' | 'confirmation' | 'marketing'
  body text not null,
  variables text[] default '{}', -- ['nome_cliente', 'horario', 'servico']
  is_approved boolean default false,
  created_at timestamptz default now()
)
```

### 4.2 Row Level Security (RLS) — princípios
- **profiles**: usuário lê/edita só o próprio.
- **venues**: leitura pública se `status='active'`. Escrita só pelo `owner_id`.
- **venue_customers, appointments, cash_*, commission_*, products, whatsapp_***: leitura/escrita só pelo owner do venue.
- **appointments**: cliente do app também vê os próprios (via `venue_customers.profile_id`).
- **reviews**: leitura pública. Escrita só do cliente com appointment `completed`.
- **subscriptions**: só admin TRYM e owner do venue.

### 4.3 Funções/triggers
- `update_venue_rating()` — após insert/update em `reviews`.
- `update_customer_stats()` — após `appointment.status='completed'` atualiza `total_spent_cents`, `visit_count`, `last_visit_at`.
- `calc_commission_on_complete()` — após appointment completed, gera registros em `commission_periods` agregando por mês.
- `auto_expire_trial()` — Edge Function diária: `trialing` + `trial_ends_at < now()` → `read_only`. Após 7 dias em `read_only` sem ação → `suspended`.
- `enforce_plan_limits()` — antes de insert em `team_members`, valida `plan='basic'` permite máx 3.

---

## 5. Fluxos do App Cliente

### 5.1 Onboarding
1. Splash → Login/Signup (email, Google, Apple).
2. Permissão de localização.
3. Permissão de notificações.
4. Home **For You**.

### 5.2 Home
- **Book again** — últimos venues onde foi.
- **Banner promocional**.
- **Favourites**.
- **Recently viewed**.
- **Recommended** — algoritmo: nicho mais buscado + proximidade + rating.
- **New to TRYM** — venues cadastrados nos últimos 30 dias.

### 5.3 Busca
- Mapa com pins (rating no pin).
- Filtros: tipo de serviço, venues, sort (distância, rating, preço), price, online booking.
- Card "Featured" no topo.
- Toggle mapa/lista.

### 5.4 Página do venue
- Galeria.
- Rating + endereço + distância.
- Tabs: Serviços | Equipe | Avaliações | Sobre.
- Botão fixo "Agendar".

### 5.5 Agendamento
1. Seleciona 1+ serviços.
2. Escolhe profissional (ou "qualquer um").
3. Calendário de disponibilidade (30 dias).
4. Escolhe horário.
5. Resumo + observações.
6. Pagamento (in-app PIX/cartão OU "pagar no local").
7. Confirmação + lembrete push (24h e 1h antes).

### 5.6 Activity
- Tabs: All | Appointments | Gift cards (v2) | Memberships (v2).
- Cada item tem "Rebook".

### 5.7 Profile
- Foto, nome, "Personal profile".
- Wallet balance (v2).
- Profile, Favourites, Forms, Settings, Support, idioma, Log out.

---

## 6. Fluxos do Painel Profissional (sistema operacional)

### 6.1 Onboarding pro
1. Cadastro (email, senha, CNPJ opcional).
2. Wizard:
   - Nome do venue + categoria.
   - Endereço (autocomplete Google Places).
   - Horários de funcionamento.
   - Primeiro serviço.
   - Foto de capa.
   - Escolha do plano (Básico/Pro) — Pro vem com tudo destravado no trial.
3. Trial 30 dias inicia.
4. Dashboard.

### 6.2 Dashboard
- Cards: agendamentos hoje, faturamento da semana, próximas reservas, taxa de no-show.
- Gráfico de agendamentos últimos 30 dias.
- Banner do status do trial (dias restantes + CTA "Adicionar cartão").

### 6.3 Agenda
- Vista **Dia | Semana | Mês**.
- **Resource view** por profissional da equipe (colunas).
- Drag-and-drop pra remarcar.
- Click vazio = criar agendamento manual.
- Click ocupado = abre detalhes (status, comanda, ações).
- Cores por status (confirmado, em andamento, completo, no-show).
- Bloqueios (almoço, folga) com motivo.

### 6.4 Comanda / PDV
Disponível ao abrir um agendamento ou criar walk-in:
- Adicionar serviços (executados por X profissional → calcula comissão se Pro).
- Adicionar produtos (do estoque).
- Aplicar desconto (% ou R$).
- Selecionar forma de pagamento (dinheiro, PIX, débito, crédito, fiado, mix).
- Fechar comanda → registra `cash_transaction` na sessão de caixa ativa.

### 6.5 Caixa
- **Abrir caixa**: informa valor inicial (troco).
- Durante o dia: todas as comandas fechadas registram transações automaticamente.
- **Sangria** (retira dinheiro) e **Suprimento** (adiciona).
- **Fechar caixa**: informa valor contado em dinheiro → mostra diferença vs. esperado.
- Histórico de sessões.

### 6.6 Clientes
- Lista com busca, filtros (tags, último atendimento).
- Cadastro manual (cliente que ligou).
- Detalhe do cliente:
  - Histórico de atendimentos.
  - Total gasto.
  - Tags.
  - **Notas privadas** (Pro).
  - Mensagens WhatsApp trocadas (Pro).
  - Aniversário (envia parabéns automático no Pro).

### 6.7 Serviços
- CRUD (nome, descrição, duração, preço, foto, subcategoria).
- Reorder drag.

### 6.8 Produtos
- CRUD básico (nome, SKU, preço, custo, estoque).
- v2: ajustes de estoque, alertas de baixa.

### 6.9 Equipe
- CRUD de membros (nome, foto, bio, % comissão padrão).
- Quais serviços cada um executa (com % override por serviço).
- Horário individual.
- Limite: Básico até 3, Pro ilimitado.

### 6.10 Comissões (Pro)
- Visão por profissional, por período.
- Detalhamento por atendimento.
- Fechamento de período (mensal) → gera relatório, marca como pago quando confirmar.

### 6.11 Financeiro
- Faturamento por período (gráficos).
- Por profissional, por serviço, por forma de pagamento.
- Recebimentos in-app (Mercado Pago).
- Status da assinatura TRYM.
- Faturas históricas.

### 6.12 Relatórios (Pro)
- Faturamento detalhado.
- Ticket médio.
- Taxa de retenção (clientes que voltaram em 30/60/90 dias).
- Top serviços.
- Top clientes.
- No-shows por período.
- Export CSV.

### 6.13 WhatsApp (Pro)
- Conectar conta WhatsApp Business (OAuth).
- Templates (aprovados pela Meta):
  - Confirmação de agendamento
  - Lembrete 24h antes
  - Lembrete 2h antes
  - Pós-atendimento (pede review)
  - Aniversário
- Configurar quais templates disparar automaticamente.
- Conversas com clientes (caixa de entrada simples — não é CRM completo, é para responder).

### 6.14 Configurações
- Dados do venue, endereço, fotos, horários.
- Toggle "aceitar pagamento no app".
- Conectar Mercado Pago (OAuth).
- Conectar WhatsApp Business (Pro).
- Plano atual + upgrade/downgrade.
- Notificações.

---

## 7. Fluxos do Admin (TRYM)

- Aprovação de venues pendentes.
- Métricas globais (MRR, churn, venues ativos, GMV, conversão de trial).
- Gestão de assinaturas (trial estendido, downgrade forçado, cancel).
- Suporte (visualizar tickets).
- Feature flags.
- Banner global (anúncios pro app cliente).
- Gestão de categorias/subcategorias.

---

## 8. Integrações

### 8.1 Mercado Pago

**Pagamento de agendamento (cliente → venue)**
- Checkout Transparente no app.
- PIX (instantâneo) + Cartão.
- Venue conecta MP via OAuth, `access_token` criptografado em `venues.mercadopago_account_id`.
- Cobrança direto pra conta do venue.
- Webhook atualiza `appointments.payment_status`.

**Assinatura TRYM (venue → você)**
- Preapproval API.
- R$ 29,90 (Básico) ou R$ 59,90 (Pro), recorrência mensal.
- Trial 30 dias: `auto_recurring.start_date` 30 dias no futuro.
- Webhook atualiza `subscriptions.status`.
- `past_due` 7 dias → `read_only`. +7 dias → `suspended`.

**Edge Functions**
- `POST /webhooks/mercadopago`
- `POST /mercadopago/connect`
- `POST /mercadopago/subscribe`
- `POST /mercadopago/checkout`

### 8.2 WhatsApp Business

**Provedor**: começar com **Z-API** (mais fácil no BR, sem aprovação da Meta inicialmente). Migrar pra **Meta Cloud API oficial** quando volume crescer.

**Fluxo de conexão**
1. Venue clica "Conectar WhatsApp".
2. Recebe QR code da Z-API (ou OAuth Meta).
3. Escaneia com celular.
4. Token criptografado salvo em `venues.whatsapp_business_token_encrypted`.

**Templates obrigatórios (aprovados Meta)**
- `appointment_confirmation`
- `appointment_reminder_24h`
- `appointment_reminder_2h`
- `review_request`
- `birthday_message`

**Workers / Edge Functions**
- Cron diário: dispara `appointment_reminder_24h` e `birthday_message`.
- Cron de hora em hora: dispara `appointment_reminder_2h`.
- Imediato após `appointment.created`: `appointment_confirmation`.
- Imediato após `appointment.status='completed'`: agenda `review_request` pra 2h depois.

### 8.3 Google Maps / Places
- Geocoding no cadastro do venue.
- Mapa de descoberta no app.

### 8.4 Resend
- E-mails: boas-vindas, reset de senha, recibo de pagamento, fatura mensal da assinatura.

---

## 9. Design System

### 9.1 Princípios
- Padrão Apple Store / top-5 App Store.
- Mobile-first, generoso em espaço.
- Tipografia humanista.
- Micro-interações sutis.
- Paleta TRYM (ver `BRAND.md`).

### 9.2 Tokens base (Tailwind)
```ts
colors: {
  brand: {
    50:  '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',  // primary
    600: '#0F766E',  // dark primary
    700: '#0D5F58',
    800: '#0A4842',
    900: '#053330',
  },
  accent: {
    400: '#F9A8D4',
    500: '#F472B6',  // CTA coral pink
    600: '#DB2777',
  },
  neutral: {
    0:   '#FFFFFF',
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    400: '#94A3B8',
    600: '#475569',
    800: '#1E293B',
    900: '#0F172A',
  },
  success: '#10B981',
  warning: '#F59E0B',
  danger:  '#EF4444',
},
fontFamily: {
  display: ['Satoshi', 'Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
},
borderRadius: {
  sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px',
}
```

### 9.3 Componentes base
- `Button` (primary, secondary, ghost, destructive)
- `Card`
- `Input`, `Select`, `Textarea`, `DatePicker`, `TimePicker`
- `Modal`, `BottomSheet`
- `Avatar`, `Badge`, `Rating`
- `EmptyState`, `Skeleton`, `Toast`
- `PlanGuard` (Pro feature gate — mostra paywall se Básico)

### 9.4 Padrões UX
- Empty states ilustrados.
- Skeleton loaders, nunca spinners full screen.
- Push de lembrete: 24h e 1h antes.
- Confirmação destrutiva via bottom sheet.
- Feature Pro: badge "PRO" + tooltip + modal de upgrade.

---

## 10. Roadmap em Sprints (MVP — 13 sprints)

| Sprint | Foco | Entregáveis |
|---|---|---|
| **0** | Setup | Monorepo, Supabase, Drizzle schema completo, CI/CD, design tokens TRYM, identidade aplicada |
| **1** | Auth + Profiles | Login/signup cliente e pro, perfis, RLS básico |
| **2** | Venue + Serviços | CRUD venue, CRUD serviços, CRUD subcategorias, horários, página pública do venue no app |
| **3** | Equipe + Disponibilidade | Team members, horários individuais, lógica de slots disponíveis |
| **4** | Agenda + Bookings manuais | Calendário visual no painel, criar appointment manual, walk-in |
| **5** | Busca cliente | Lista, mapa, filtros, geolocalização, página do venue no app |
| **6** | Booking via marketplace | Fluxo de agendamento no app, slots, confirmação |
| **7** | Clientes + Notas | venue_customers, ficha completa, busca, tags |
| **8** | PDV + Caixa | Comanda, fechamento, formas de pagamento, abertura/fechamento de caixa, sangria |
| **9** | Comissões + Plano gating | Cálculo automático, fechamento período, PlanGuard nos endpoints |
| **10** | Pagamentos + Assinaturas | MP checkout in-app + Preapproval Básico/Pro, webhooks, trial |
| **11** | WhatsApp + Reviews | Z-API integration, templates, lembretes automáticos, reviews, favoritos |
| **12** | Dashboard pro + Relatórios | Métricas, gráficos, relatórios Pro, export CSV |
| **13** | Admin + Polish + Beta | Painel admin, aprovação de venues, métricas globais, bug bash, TestFlight |

### Pós-MVP (v1.1+)
- Estoque de produtos com alertas
- Gift cards
- Memberships / pacotes
- Múltiplas unidades
- Programa de fidelidade
- NF-e
- Marketing campaigns no WhatsApp
- Programa de indicação

---

## 11. Padrões de Código

- **TypeScript strict** sempre. Zero `any` sem comment.
- **Zod** valida todo input externo.
- **Drizzle** pra schema e queries tipadas.
- **Sem SQL raw** salvo necessidade extrema.
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`.
- **Branches**: `main`, `develop`, `feat/xxx`, `fix/xxx`.
- **Testes**: Vitest (unit), Playwright (E2E web), Maestro (E2E mobile).
- **Sem mock data em produção.**
- **Idioma**: PT-BR no produto. Comentários e código em inglês.
- **PlanGuard pattern**: toda feature Pro tem middleware no backend + componente no frontend que checa `subscription.plan === 'pro'`.

---

## 12. Variáveis de Ambiente

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Mercado Pago
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=
MP_CLIENT_ID=
MP_CLIENT_SECRET=

# WhatsApp (Z-API inicial)
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=

# Google
EXPO_PUBLIC_GOOGLE_MAPS_KEY_IOS=
EXPO_PUBLIC_GOOGLE_MAPS_KEY_ANDROID=
NEXT_PUBLIC_GOOGLE_PLACES_KEY=

# Email
RESEND_API_KEY=

# Analytics & Errors
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Encryption (pra tokens MP e WhatsApp)
ENCRYPTION_KEY=
```

---

## 13. Fora do MVP

- Estoque de produtos com controle real
- Gift cards e memberships
- Múltiplas unidades por venue
- NF-e
- Programa de fidelidade
- Programa de indicação
- Marketing campaigns WhatsApp
- Chat interno cliente↔venue (WhatsApp resolve)
- BI avançado / exportação além de CSV
- Versão tablet do painel
- Multi-idioma (só PT-BR)

---

**Fim do documento.**
