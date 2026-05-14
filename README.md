# TRYM

Marketplace de serviços multi-nicho (Beleza, Pet, Fitness) para o Brasil.

## Requisitos

- Node.js 22+
- pnpm 11+
- Conta no Supabase
- Conta no Expo (EAS Build)

## Instalação

```bash
pnpm install
```

## Variáveis de ambiente

```bash
cp .env.example .env
# Preencha as variáveis no .env
```

## Rodar em desenvolvimento

```bash
# Tudo (web + mobile)
pnpm dev

# Só o painel web
pnpm dev --filter=@trym/web

# Só o app mobile
pnpm dev --filter=@trym/mobile
```

## Banco de dados

```bash
# Gerar migrations
pnpm db:generate

# Rodar migrations no Supabase
pnpm db:migrate

# Popular com dados de teste
pnpm db:seed
```

## Build

```bash
pnpm build
```

## Estrutura

```
apps/
  mobile/   # Expo (iOS + Android) — app do cliente final
  web/      # Next.js — painel do profissional + admin
packages/
  config/   # ESLint, Prettier, TypeScript, Tailwind configs
  db/       # Drizzle schema + migrations + seed
  api/      # Zod schemas + tipos TypeScript compartilhados
  ui/       # Componentes compartilhados
  utils/    # Helpers (formatação BR, datas, etc.)
```

## Stack

- **Mobile**: Expo SDK 52 + Expo Router + NativeWind + TanStack Query + Zustand
- **Web**: Next.js 15 + shadcn/ui + Tailwind v4 + TanStack Query
- **Backend**: Supabase + Drizzle ORM
- **Pagamento**: Mercado Pago
- **Push**: Expo Notifications
- **E-mail**: Resend
