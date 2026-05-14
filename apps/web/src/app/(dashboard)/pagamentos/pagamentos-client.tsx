"use client";

import { useState } from "react";
import { CreditCard, ArrowDownLeft, Clock, Search, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionRow, PaymentMethodStat } from "./page";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  confirmed:   { label: "Confirmado",   bg: "bg-brand-50",   text: "text-brand-700"   },
  in_progress: { label: "Em andamento", bg: "bg-amber-50",   text: "text-amber-700"   },
  completed:   { label: "Concluído",    bg: "bg-emerald-50", text: "text-emerald-700" },
  no_show:     { label: "No-show",      bg: "bg-neutral-100","text": "text-neutral-500" },
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Dinheiro", pix: "PIX", debit: "Débito",
  credit: "Crédito", on_credit: "Fiado", in_app: "App",
};

// ─── Main component ────────────────────────────────────────────────────────────

export function PagamentosClient({
  transactions,
  stats,
  methodStats,
}: {
  transactions: TransactionRow[];
  stats: { monthRevenue: number; pendingTotal: number };
  methodStats: PaymentMethodStat[];
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? transactions.filter(
        (t) =>
          t.venue_customers?.full_name.toLowerCase().includes(query.toLowerCase()) ||
          t.appointment_items[0]?.description.toLowerCase().includes(query.toLowerCase()),
      )
    : transactions;

  const maxMethod = methodStats[0]?.total_cents ?? 1;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pagamentos</h1>
          <p className="text-sm text-text-secondary mt-0.5">Receitas e histórico financeiro</p>
        </div>
        <a
          href="/configuracoes"
          className="flex items-center gap-1.5 rounded-xl border border-border-default bg-surface-0 px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          Configurar Mercado Pago
        </a>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5 flex items-center gap-4 hover:border-border-default hover:shadow-sm transition-all">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">Receita do mês</p>
            <p className="mt-1 text-2xl font-mono font-bold text-text-primary tabular-nums">{formatCurrency(stats.monthRevenue)}</p>
            <p className="text-xs text-text-tertiary">Atendimentos concluídos</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5 flex items-center gap-4 hover:border-border-default hover:shadow-sm transition-all">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">A receber</p>
            <p className="mt-1 text-2xl font-mono font-bold text-text-primary tabular-nums">{formatCurrency(stats.pendingTotal)}</p>
            <p className="text-xs text-text-tertiary">Agendamentos confirmados</p>
          </div>
        </div>
      </div>

      {/* Payment method breakdown */}
      {methodStats.length > 0 && (
        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
          <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-4">Por forma de pagamento — este mês</p>
          <div className="space-y-3">
            {methodStats.map((ms) => (
              <div key={ms.method}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-text-primary">{ms.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-tertiary">{ms.count}x</span>
                    <span className="text-sm font-mono font-bold text-text-primary tabular-nums">{formatCurrency(ms.total_cents)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${(ms.total_cents / maxMethod) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-wrap gap-3">
          <p className="text-sm font-semibold text-text-primary">Histórico de transações</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente ou serviço…"
              className="rounded-xl border border-border-default bg-surface-1 pl-8 pr-8 py-2 text-xs text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
            {query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-text-tertiary" /></button>}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-3">
              <CreditCard className="h-6 w-6 text-brand-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-text-primary">
              {transactions.length === 0 ? "Nenhuma transação ainda" : "Nenhum resultado"}
            </p>
            <p className="mt-1 text-xs text-text-tertiary max-w-xs">
              {transactions.length === 0
                ? "Pagamentos de agendamentos aparecerão aqui."
                : "Tente outros termos na busca."}
            </p>
            {transactions.length === 0 && (
              <div className="mt-4 rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-left max-w-xs">
                <p className="text-xs font-semibold text-text-primary mb-1">Configure o Mercado Pago</p>
                <p className="text-xs text-text-tertiary">
                  Aceite pagamentos online via PIX e cartão sem sair do TRYM.
                </p>
                <a href="/configuracoes" className="mt-2 block text-xs font-semibold text-brand-700 hover:underline">
                  Conectar agora →
                </a>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {filtered.map((t) => {
              const s = STATUS_CONFIG[t.status];
              const service = t.appointment_items[0]?.description ?? "Serviço";
              const method = t.payment_method ? (METHOD_LABEL[t.payment_method] ?? t.payment_method) : null;
              return (
                <li key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-1 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-4 w-4 text-text-tertiary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {t.venue_customers?.full_name ?? "Cliente"}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {service} · {formatDate(t.scheduled_at)}
                      {method && ` · ${method}`}
                    </p>
                  </div>
                  {s && (
                    <span className={cn("hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold", s.bg, s.text)}>
                      {s.label}
                    </span>
                  )}
                  <span className={cn(
                    "text-sm font-mono font-bold tabular-nums flex-shrink-0",
                    t.status === "completed" ? "text-emerald-700" : "text-text-primary",
                  )}>
                    {formatCurrency(t.total_cents)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
