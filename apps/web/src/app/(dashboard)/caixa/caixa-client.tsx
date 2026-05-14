"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive, Plus, Minus, X, AlertCircle, CheckCircle2,
  ArrowDownLeft, ArrowUpRight, CreditCard, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { CaixaSession, CaixaTransaction, DailySummary } from "./page";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(cents / 100);
}

function fmtDatetime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

const TX_TYPE: Record<string, { label: string; color: string; sign: string }> = {
  sale:       { label: "Venda",       color: "text-emerald-700", sign: "+" },
  refund:     { label: "Estorno",     color: "text-red-600",     sign: "−" },
  sangria:    { label: "Sangria",     color: "text-amber-700",   sign: "−" },
  suprimento: { label: "Suprimento",  color: "text-brand-700",   sign: "+" },
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Dinheiro", pix: "PIX", debit: "Débito", credit: "Crédito", on_credit: "Fiado",
};

// ─── Open session card ─────────────────────────────────────────────────────────

function OpenCaixaCard({
  venueId,
  userId,
  onOpened,
}: {
  venueId: string;
  userId: string;
  onOpened: () => void;
}) {
  const supabase = createClient();
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    const cents = Math.round(parseFloat(amount.replace(",", ".") || "0") * 100);
    setError(null);
    startTransition(async () => {
      const { error: e } = await supabase.from("cash_register_sessions").insert({
        venue_id: venueId,
        opened_by: userId,
        opening_amount_cents: cents,
      });
      if (e) { setError(e.message); return; }
      onOpened();
    });
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl border border-border-subtle bg-surface-0 p-8 flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
          <Archive className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Caixa fechado</h2>
        <p className="text-sm text-text-tertiary mb-6 max-w-xs">
          Abra o caixa para registrar vendas e controlar o movimento do dia.
        </p>

        <div className="w-full space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5 text-left">
              Valor inicial (troco em caixa)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-tertiary">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-border-default bg-surface-1 pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleOpen}
            disabled={pending}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-bold transition-all",
              !pending
                ? "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]"
                : "bg-surface-3 text-text-disabled cursor-not-allowed",
            )}
          >
            {pending ? "Abrindo…" : "Abrir caixa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sangria / Suprimento Modal ────────────────────────────────────────────────

function MovimentoModal({
  sessionId,
  type,
  onClose,
  onDone,
}: {
  sessionId: string;
  type: "sangria" | "suprimento";
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isSangria = type === "sangria";
  const title = isSangria ? "Sangria" : "Suprimento";
  const desc = isSangria
    ? "Retirada de dinheiro do caixa"
    : "Adição de dinheiro ao caixa";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount.replace(",", ".") || "0") * 100);
    if (cents <= 0) { setError("Informe um valor maior que zero"); return; }
    setError(null);
    startTransition(async () => {
      const { error: e } = await supabase.from("cash_transactions").insert({
        session_id: sessionId,
        type,
        payment_method: "cash",
        amount_cents: cents,
        description: description.trim() || title,
      });
      if (e) { setError(e.message); return; }
      onDone();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm bg-surface-0 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-base font-bold text-text-primary">{title}</h2>
            <p className="text-xs text-text-tertiary">{desc}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-tertiary">R$</span>
              <input
                autoFocus
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-border-default bg-surface-1 pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Motivo (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isSangria ? "Retirada para despesa…" : "Adicionar troco…"}
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border-default py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
              !pending
                ? isSangria
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-surface-3 text-text-disabled cursor-not-allowed",
            )}
          >
            {pending ? "Salvando…" : `Confirmar ${title}`}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Close session modal ───────────────────────────────────────────────────────

function FecharCaixaModal({
  session,
  summary,
  venueId,
  onClose,
  onClosed,
}: {
  session: CaixaSession;
  summary: DailySummary;
  venueId: string;
  onClose: () => void;
  onClosed: () => void;
}) {
  const supabase = createClient();
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const expectedCash =
    session.opening_amount_cents +
    summary.cashTotal +
    summary.suprimento -
    summary.sangria;

  const countedCents = Math.round(parseFloat(counted.replace(",", ".") || "0") * 100);
  const diff = countedCents - expectedCash;

  function handleClose() {
    setError(null);
    startTransition(async () => {
      const { error: e } = await supabase
        .from("cash_register_sessions")
        .update({
          closed_at: new Date().toISOString(),
          closing_amount_cents: countedCents,
          expected_amount_cents: expectedCash,
          difference_cents: diff,
          notes: notes.trim() || null,
        })
        .eq("id", session.id);
      if (e) { setError(e.message); return; }
      onClosed();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-sm bg-surface-0 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-base font-bold text-text-primary">Fechar caixa</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Expected */}
          <div className="rounded-xl bg-surface-2 px-4 py-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">Abertura</span>
              <span className="font-mono text-text-secondary">{fmt(session.opening_amount_cents)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">Vendas dinheiro</span>
              <span className="font-mono text-emerald-700">+{fmt(summary.cashTotal)}</span>
            </div>
            {summary.suprimento > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Suprimento</span>
                <span className="font-mono text-brand-700">+{fmt(summary.suprimento)}</span>
              </div>
            )}
            {summary.sangria > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">Sangria</span>
                <span className="font-mono text-amber-700">−{fmt(summary.sangria)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-border-subtle">
              <span className="text-text-primary">Esperado em dinheiro</span>
              <span className="font-mono text-text-primary">{fmt(expectedCash)}</span>
            </div>
          </div>

          {/* Counted */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Valor contado em caixa
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-tertiary">R$</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="0.01"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-border-default bg-surface-1 pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              />
            </div>
          </div>

          {/* Difference */}
          {counted && (
            <div className={cn(
              "flex items-center justify-between rounded-xl px-4 py-3",
              diff === 0 ? "bg-emerald-50 border border-emerald-200" :
              diff > 0  ? "bg-brand-50 border border-brand-200" :
                          "bg-red-50 border border-red-200",
            )}>
              <span className="text-xs font-semibold text-text-secondary">Diferença</span>
              <span className={cn(
                "text-sm font-mono font-bold tabular-nums",
                diff === 0 ? "text-emerald-700" :
                diff > 0  ? "text-brand-700" :
                            "text-red-700",
              )}>
                {diff > 0 ? "+" : ""}{fmt(diff)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Motivo da diferença, ocorrências…"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border-default py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleClose}
            disabled={pending || !counted}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
              !pending && counted
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-surface-3 text-text-disabled cursor-not-allowed",
            )}
          >
            {pending ? "Fechando…" : "Fechar caixa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active session view ───────────────────────────────────────────────────────

function CaixaAberta({
  session,
  transactions,
  summary,
  venueId,
  onRefresh,
}: {
  session: CaixaSession;
  transactions: CaixaTransaction[];
  summary: DailySummary;
  venueId: string;
  onRefresh: () => void;
}) {
  const [showSangria, setShowSangria] = useState(false);
  const [showSuprimento, setShowSuprimento] = useState(false);
  const [showFechar, setShowFechar] = useState(false);

  const totalSales = summary.cashTotal + summary.otherTotal;
  const expectedCash =
    session.opening_amount_cents + summary.cashTotal + summary.suprimento - summary.sangria;

  return (
    <div className="space-y-6">

      {/* Session header */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900">Caixa aberto</p>
            <p className="text-xs text-emerald-700">Desde {fmtDatetime(session.opened_at)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowFechar(true)}
          className="rounded-xl bg-emerald-700 text-white text-xs font-bold px-4 py-2 hover:bg-emerald-800 transition-all"
        >
          Fechar caixa
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Vendas total",     value: fmt(totalSales),                    sub: `${summary.salesCount} venda${summary.salesCount !== 1 ? "s" : ""}`,    icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Dinheiro",         value: fmt(summary.cashTotal),             sub: "em vendas",                                                             icon: Archive,       color: "text-brand-600",   bg: "bg-brand-50"   },
          { label: "Outros métodos",   value: fmt(summary.otherTotal),            sub: "PIX, cartão…",                                                          icon: CreditCard,    color: "text-violet-600",  bg: "bg-violet-50"  },
          { label: "Esperado em caixa",value: fmt(expectedCash),                  sub: `abertura + entradas`,                                                   icon: Archive,       color: "text-amber-600",   bg: "bg-amber-50"   },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-border-subtle bg-surface-0 p-4 hover:border-border-default transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">{label}</span>
              <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("h-3 w-3", color)} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-lg font-mono font-bold text-text-primary tabular-nums">{value}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowSangria(true)}
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-all"
        >
          <Minus className="h-4 w-4" />
          Sangria
        </button>
        <button
          onClick={() => setShowSuprimento(true)}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-100 transition-all"
        >
          <Plus className="h-4 w-4" />
          Suprimento
        </button>
      </div>

      {/* Transactions list */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <p className="text-sm font-semibold text-text-primary">Movimentações do dia</p>
        </div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Archive className="h-8 w-8 text-text-disabled mb-3" strokeWidth={1} />
            <p className="text-sm text-text-tertiary">Nenhuma movimentação ainda</p>
            <p className="text-xs text-text-tertiary mt-1">Feche a comanda de um agendamento para registrar.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {transactions.map((tx) => {
              const cfg = TX_TYPE[tx.type] ?? { label: tx.type, color: "text-text-primary", sign: "" };
              const isSale = tx.type === "sale";
              const isNegative = tx.type === "sangria" || tx.type === "refund";
              const customerName = (tx.appointments as { venue_customers: { full_name: string } | null } | null)?.venue_customers?.full_name;

              return (
                <li key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    isSale ? "bg-emerald-50" : isNegative ? "bg-amber-50" : "bg-brand-50",
                  )}>
                    {isSale ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" strokeWidth={1.5} /> :
                     isNegative ? <ArrowUpRight className="h-4 w-4 text-amber-600" strokeWidth={1.5} /> :
                     <ArrowDownLeft className="h-4 w-4 text-brand-600" strokeWidth={1.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {isSale && customerName ? customerName : (tx.description ?? cfg.label)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {cfg.label}
                      {isSale && ` · ${METHOD_LABEL[tx.payment_method] ?? tx.payment_method}`}
                      {" · "}
                      {fmtTime(tx.created_at)}
                    </p>
                  </div>
                  <span className={cn("text-sm font-mono font-bold tabular-nums", cfg.color)}>
                    {cfg.sign}{fmt(tx.amount_cents)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modals */}
      {showSangria && (
        <MovimentoModal
          sessionId={session.id}
          type="sangria"
          onClose={() => setShowSangria(false)}
          onDone={() => { setShowSangria(false); onRefresh(); }}
        />
      )}
      {showSuprimento && (
        <MovimentoModal
          sessionId={session.id}
          type="suprimento"
          onClose={() => setShowSuprimento(false)}
          onDone={() => { setShowSuprimento(false); onRefresh(); }}
        />
      )}
      {showFechar && (
        <FecharCaixaModal
          session={session}
          summary={summary}
          venueId={venueId}
          onClose={() => setShowFechar(false)}
          onClosed={() => { setShowFechar(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Session history ───────────────────────────────────────────────────────────

function SessionHistory({ history }: { history: CaixaSession[] }) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-0 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border-subtle">
        <History className="h-4 w-4 text-text-tertiary" />
        <p className="text-sm font-semibold text-text-primary">Histórico de sessões</p>
      </div>
      <ul className="divide-y divide-border-subtle">
        {history.map((s) => {
          const diff = s.difference_cents;
          return (
            <li key={s.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary">
                  {fmtDatetime(s.opened_at)}
                  {s.closed_at && ` → ${fmtDatetime(s.closed_at)}`}
                </p>
                {s.notes && <p className="text-xs text-text-tertiary mt-0.5 truncate">{s.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                {s.closing_amount_cents !== null && (
                  <p className="text-sm font-mono font-semibold text-text-primary">{fmt(s.closing_amount_cents)}</p>
                )}
                {diff !== null && diff !== 0 && (
                  <p className={cn("text-[10px] font-mono", diff > 0 ? "text-brand-600" : "text-red-600")}>
                    {diff > 0 ? "+" : ""}{fmt(diff)}
                  </p>
                )}
                {diff === 0 && (
                  <p className="text-[10px] text-emerald-600">Sem diferença</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CaixaClient({
  venueId,
  userId,
  activeSession,
  transactions,
  summary,
  history,
}: {
  venueId: string;
  userId: string;
  activeSession: CaixaSession | null;
  transactions: CaixaTransaction[];
  summary: DailySummary;
  history: CaixaSession[];
}) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Caixa</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Controle o movimento financeiro diário do seu negócio
        </p>
      </div>

      {activeSession ? (
        <CaixaAberta
          session={activeSession}
          transactions={transactions}
          summary={summary}
          venueId={venueId}
          onRefresh={refresh}
        />
      ) : (
        <OpenCaixaCard venueId={venueId} userId={userId} onOpened={refresh} />
      )}

      <SessionHistory history={history} />

    </div>
  );
}
