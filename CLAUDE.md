# 🤖 Prompt Inicial — Claude Code

## Contexto do Projeto

Você é meu programador sênior trabalhando no projeto **[NOME_DO_APP]** — um marketplace de serviços multi-nicho (Beleza, Pet, Fitness) para o Brasil, inspirado no Fresha (EUA).

A spec completa está em `SPEC_MASTER.md` na raiz do repo. **Leia ela inteira antes de fazer qualquer coisa.** Toda decisão técnica precisa estar alinhada com a spec; se algo não estiver coberto, me pergunte antes de assumir.

---

## Stack (resumo — detalhes na spec)

- **Monorepo**: Turborepo + pnpm workspaces
- **Mobile**: Expo SDK 52 + Expo Router + TypeScript strict + NativeWind + TanStack Query + Zustand + Zod
- **Web**: Next.js 15 (App Router) + shadcn/ui + Tailwind v4 + TanStack Query
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions) + Drizzle ORM
- **Pagamento**: Mercado Pago (checkout + assinatura)
- **Push**: Expo Notifications
- **E-mail**: Resend

---

## Padrões obrigatórios

1. **Sem mock data.** Tudo plugado no Supabase desde a primeira tela. Se precisar de dados pra testar, escreva um seed em `packages/db/seed.ts`.
2. **TypeScript strict.** Zero `any` sem comentário justificando.
3. **Validação com Zod.** Todo input externo (formulário, edge function, webhook) passa por Zod.
4. **Drizzle pra schema e queries.** Sem SQL raw a menos que indispensável.
5. **RLS sempre habilitado** em toda tabela. Sem exceção.
6. **Conventional Commits.** `feat:`, `fix:`, `chore:`, `refactor:`.
7. **Qualidade visual padrão Apple Store / top-5 App Store.** Generoso em espaço, micro-interações, empty states ilustrados, skeleton loaders (nunca spinners full screen).
8. **Mobile-first** sempre, mesmo no web (painel é responsivo).
9. **Idioma**: PT-BR no produto. Comentários e código em inglês.

---

## Ordem de execução do Sprint 0 (Setup)

Faça nessa ordem, **uma tarefa por vez**, mostrando o que vai fazer antes e pedindo confirmação se houver decisão ambígua:

### 1. Inicializar o monorepo
- `pnpm init` na raiz, configurar `pnpm-workspace.yaml`.
- Instalar e configurar Turborepo (`turbo.json`).
- Criar estrutura de pastas conforme spec (`apps/`, `packages/`).
- `.gitignore`, `.editorconfig`, `.nvmrc` (Node 22 LTS).
- `README.md` na raiz explicando como rodar.

### 2. Configurar `packages/config`
- ESLint config compartilhado (extends `eslint-config-next` + `expo`).
- Prettier config.
- TypeScript base config (`tsconfig.base.json`).
- Tailwind preset compartilhado com os tokens da identidade visual (ver `BRAND.md`).

### 3. Configurar `packages/db`
- Instalar Drizzle ORM + drizzle-kit + postgres driver.
- Criar `schema.ts` com TODAS as tabelas da seção 3.1 da spec.
- Configurar `drizzle.config.ts`.
- Script `pnpm db:generate` e `pnpm db:migrate`.
- Criar `seed.ts` com dados realistas: 3 categorias, ~10 subcategorias, 5 venues fictícios em São Paulo, serviços, horários, 1 cliente de teste, 1 pro de teste.

### 4. Configurar Supabase
- Criar projeto no Supabase (me peça as credenciais se eu não tiver criado).
- Rodar as migrations do Drizzle.
- Criar policies de RLS conforme seção 3.2 da spec.
- Criar buckets no Storage: `avatars`, `venues`, `services`.

### 5. Configurar `packages/api`
- Schemas Zod compartilhados (signup, login, create venue, create appointment, etc.).
- Tipos TypeScript exportados.

### 6. Inicializar `apps/mobile` (Expo)
- `npx create-expo-app` com template TypeScript.
- Configurar Expo Router v4.
- Instalar NativeWind v4 e aplicar tokens da identidade.
- Configurar Supabase client (`@supabase/supabase-js` + `@react-native-async-storage/async-storage`).
- Tela de splash + login funcionando, conectando ao Supabase Auth.
- Configurar `app.json` (icon, splash, bundle id, permissões de location e notifications).

### 7. Inicializar `apps/web` (Next.js)
- `npx create-next-app@latest` com App Router + TS + Tailwind.
- Instalar shadcn/ui e adicionar componentes base.
- Aplicar tokens da identidade.
- Configurar Supabase client (`@supabase/ssr`).
- Tela de login funcionando.
- Layout base do painel (sidebar + header).

### 8. CI/CD básico
- GitHub Actions: lint + typecheck + build em PRs.
- Deploy preview do `apps/web` na Vercel.
- EAS Build configurado pra `apps/mobile` (sem rodar build ainda).

---

## Antes de começar

Me confirme:
1. Você leu a `SPEC_MASTER.md` inteira? Tem alguma dúvida ou contradição?
2. Você leu o `BRAND.md` e sabe qual identidade visual vamos aplicar?
3. Tenho conta no Supabase, Vercel, Expo, Mercado Pago, Resend, Google Cloud (Maps + Places)?

Quando estiver pronto, comece pelo passo 1 do Sprint 0 e me mostre o resultado antes de seguir pro 2.

---

## Como conversar comigo

- **Pergunte antes de assumir** decisões que não estão na spec.
- **Mostre o que vai fazer** antes de mudanças grandes.
- **Não invente features.** Se algo está fora do escopo do MVP, me avise antes de codar.
- **Reporte progresso** ao final de cada tarefa.
- **Português**: pode responder em PT-BR comigo. Código e comentários em inglês.
