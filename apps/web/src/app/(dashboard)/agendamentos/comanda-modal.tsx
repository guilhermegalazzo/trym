"use client";
/* eslint-disable react-compiler/react-compiler */

import { useState, useEffect, useTransition } from "react";
import {
  X, Plus, Trash2, ChevronRight, AlertCircle,
  CheckCircle2, PlayCircle, XCircle, UserMinus,
  Minus, Percent, DollarSign as DollarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ServiceRow } from "./page";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AptStatus = "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

type AptDetail = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AptStatus;
  total_cents: number;
  payment_method: string | null;
  customer_notes: string | null;
  venue_customer_id: string;
  venue_customers: { id: string; full_name: string; phone: string | null; total_spent_cents: number; visit_count: number } | null;
  team_members: { id: string; display_name: string } | null;
  appointment_items: ComandaItem[];
};

type ComandaItem = {
  id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  _new?: boolean;
  _removed?: boolean;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(cents / 100);
}

function fmtDatetime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

const PAYMENT_OPTIONS = [
  { value: "cash",      label: "Dinheiro" },
  { value: "pix",       label: "PIX"      },
  { value: "debit",     label: "Débito"   },
  { value: "credit",    label: "Crédito"  },
  { value: "on_credit", label: "Fiado"    },
];

const STATUS_CONFIG: Record<AptStatus, { label: string; bg: string; text: string }> = {
  confirmed:   { label: "Confirmado",   bg: "bg-brand-50",   text: "text-brand-700"   },
  in_progress: { label: "Em andamento", bg: "bg-amber-50",   text: "text-amber-700"   },
  completed:   { label: "Concluído",    bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled:   { label: "Cancelado",    bg: "bg-red-50",     text: "text-red-600"     },
  no_show:     { label: "No-show",      bg: "bg-neutral-100","text":"text-neutral-500" },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function ComandaModal({
  appointmentId,
  venueId,
  services,
  onClose,
  onUpdated,
}: {
  appointmentId: string;
  venueId: string;
  services: ServiceRow[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const supabase = createClient();
  const [apt, setApt] = useState<AptDetail | null>(null);
  const [loadingApt, setLoadingApt] = useState(true);
  const [items, setItems] = useState<ComandaItem[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [discountType, setDiscountType] = useState<"pct" | "fixed">("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Load appointment details
  useEffect(() => {
    supabase
      .from("appointments")
      .select(`
        id, scheduled_at, duration_minutes, status, total_cents,
        payment_method, customer_notes, venue_customer_id,
        venue_customers ( id, full_name, phone, total_spent_cents, visit_count ),
        team_members ( id, display_name ),
        appointment_items ( id, service_id, description, quantity, unit_price_cents, total_cents )
      `)
      .eq("id", appointmentId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setLoadingApt(false); return; }
        const d = data as unknown as AptDetail;
        setApt(d);
        setItems(d.appointment_items ?? []);
        setPaymentMethod(d.payment_method ?? "cash");
        setLoadingApt(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const activeItems = items.filter((i) => !i._removed);
  const subtotal = activeItems.reduce((s, i) => s + i.total_cents, 0);

  const discountCents = (() => {
    const v = parseFloat(discountValue) || 0;
    if (discountType === "pct") return Math.round(subtotal * Math.min(v, 100) / 100);
    return Math.round(v * 100);
  })();

  const totalCents = Math.max(0, subtotal - discountCents);

  // ── Item actions ─────────────────────────────────────────────────────────────

  function removeItem(id: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, _removed: true } : i));
  }

  function addService(sv: ServiceRow) {
    const tempId = `new-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: tempId,
        service_id: sv.id,
        description: sv.name,
        quantity: 1,
        unit_price_cents: sv.price_cents,
        total_cents: sv.price_cents,
        _new: true,
      },
    ]);
    setShowAddService(false);
    setServiceQuery("");
  }

  // ── Status quick actions (no payment) ────────────────────────────────────────

  function handleStatusOnly(status: AptStatus) {
    setError(null);
    startTransition(async () => {
      const { error: e } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);
      if (e) { setError(e.message); return; }
      onUpdated();
    });
  }

  // ── Close comanda (with payment) ─────────────────────────────────────────────

  function handleClose() {
    if (!apt) return;
    setError(null);
    startTransition(async () => {
      // 1. Delete removed items
      const removedIds = items.filter((i) => i._removed && !i._new).map((i) => i.id);
      if (removedIds.length > 0) {
        await supabase.from("appointment_items").delete().in("id", removedIds);
      }

      // 2. Insert new items
      const newItems = items.filter((i) => i._new && !i._removed);
      if (newItems.length > 0) {
        await supabase.from("appointment_items").insert(
          newItems.map((i) => ({
            appointment_id: appointmentId,
            service_id: i.service_id,
            description: i.description,
            quantity: i.quantity,
            unit_price_cents: i.unit_price_cents,
            total_cents: i.total_cents,
          })),
        );
      }

      // 3. Update appointment
      const { error: ae } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          total_cents: totalCents,
          payment_method: paymentMethod,
          payment_status: "paid",
        })
        .eq("id", appointmentId);
      if (ae) { setError(ae.message); return; }

      // 4. Update venue_customer stats
      const vc = apt.venue_customers;
      if (vc) {
        await supabase
          .from("venue_customers")
          .update({
            total_spent_cents: (vc.total_spent_cents ?? 0) + totalCents,
            visit_count: (vc.visit_count ?? 0) + 1,
            last_visit_at: new Date().toISOString(),
          })
          .eq("id", vc.id);
      }

      // 5. Register cash transaction if there's an active session
      const { data: session } = await supabase
        .from("cash_register_sessions")
        .select("id")
        .eq("venue_id", venueId)
        .is("closed_at", null)
        .maybeSingle();

      if (session && totalCents > 0) {
        await supabase.from("cash_transactions").insert({
          session_id: session.id,
          appointment_id: appointmentId,
          type: "sale",
          payment_method: paymentMethod,
          amount_cents: totalCents,
          description: apt.venue_customers?.full_name ?? "Venda",
        });
      }

      onUpdated();
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const filteredServices = serviceQuery.trim()
    ? services.filter((s) => s.name.toLowerCase().includes(serviceQuery.toLowerCase()))
    : services;

  const statusCfg = apt ? STATUS_CONFIG[apt.status] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 w-full sm:max-w-lg bg-surface-0 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
          {loadingApt ? (
            <div className="h-10 w-48 rounded-lg bg-surface-2 animate-pulse" />
          ) : apt ? (
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-bold text-text-primary">
                  {apt.venue_customers?.full_name ?? "Cliente"}
                </h2>
                {statusCfg && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusCfg.bg, statusCfg.text)}>
                    {statusCfg.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary">
                {fmtDatetime(apt.scheduled_at)}
                {apt.team_members && ` · ${apt.team_members.display_name}`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">Agendamento não encontrado</p>
          )}
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors flex-shrink-0 ml-2">
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {loadingApt ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse" />)}
            </div>
          ) : apt ? (
            <>
              {/* Items list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">Itens da comanda</p>
                  <button
                    onClick={() => setShowAddService(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </button>
                </div>

                {activeItems.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border-default py-6 flex flex-col items-center text-center">
                    <p className="text-xs text-text-tertiary">Nenhum serviço na comanda</p>
                    <button
                      onClick={() => setShowAddService(true)}
                      className="mt-2 text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Adicionar serviço
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {activeItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-1 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{item.description}</p>
                          <p className="text-xs text-text-tertiary">{item.quantity}x · {fmt(item.unit_price_cents)}</p>
                        </div>
                        <span className="text-sm font-mono font-semibold text-text-primary tabular-nums">{fmt(item.total_cents)}</span>
                        {apt.status !== "completed" && (
                          <button onClick={() => removeItem(item.id)} className="text-text-tertiary hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add service panel */}
                {showAddService && (
                  <div className="mt-3 rounded-xl border border-border-default bg-surface-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
                      <input
                        autoFocus
                        type="search"
                        value={serviceQuery}
                        onChange={(e) => setServiceQuery(e.target.value)}
                        placeholder="Buscar serviço…"
                        className="flex-1 text-xs text-text-primary placeholder-text-tertiary outline-none bg-transparent"
                      />
                      <button onClick={() => { setShowAddService(false); setServiceQuery(""); }}>
                        <X className="h-3.5 w-3.5 text-text-tertiary" />
                      </button>
                    </div>
                    <ul className="max-h-44 overflow-y-auto divide-y divide-border-subtle">
                      {filteredServices.length === 0 ? (
                        <li className="px-4 py-3 text-xs text-text-tertiary text-center">Nenhum serviço</li>
                      ) : filteredServices.map((sv) => (
                        <li key={sv.id}>
                          <button
                            onClick={() => addService(sv)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-2 transition-colors text-left"
                          >
                            <span className="text-xs font-medium text-text-primary">{sv.name}</span>
                            <span className="text-xs font-mono text-text-secondary">{fmt(sv.price_cents)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Discount — only when not completed */}
              {apt.status !== "completed" && (
                <div>
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Desconto</p>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-xl border border-border-default overflow-hidden flex-shrink-0">
                      <button
                        onClick={() => setDiscountType("fixed")}
                        className={cn("px-3 py-2 text-xs font-semibold transition-colors", discountType === "fixed" ? "bg-brand-600 text-white" : "text-text-secondary hover:bg-surface-2")}
                      >
                        <DollarIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setDiscountType("pct")}
                        className={cn("px-3 py-2 text-xs font-semibold transition-colors", discountType === "pct" ? "bg-brand-600 text-white" : "text-text-secondary hover:bg-surface-2")}
                      >
                        <Percent className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step={discountType === "pct" ? "1" : "0.01"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === "fixed" ? "0,00" : "0"}
                        className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">
                        {discountType === "pct" ? "%" : "R$"}
                      </span>
                    </div>
                    {discountCents > 0 && (
                      <span className="text-xs font-mono text-red-500 tabular-nums flex-shrink-0">−{fmt(discountCents)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Payment method — only when not completed */}
              {apt.status !== "completed" && (
                <div>
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Pagamento</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PAYMENT_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setPaymentMethod(value)}
                        className={cn(
                          "rounded-xl border py-2 text-xs font-semibold transition-all",
                          paymentMethod === value
                            ? "border-brand-600 bg-brand-50 text-brand-800"
                            : "border-border-default text-text-secondary hover:bg-surface-2",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="rounded-xl bg-surface-1 border border-border-subtle px-4 py-3 space-y-2">
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{fmt(subtotal)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Desconto</span>
                    <span className="font-mono tabular-nums">−{fmt(discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-text-primary pt-1 border-t border-border-subtle">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{fmt(totalCents)}</span>
                </div>
              </div>

              {/* Customer notes */}
              {apt.customer_notes && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1">Nota do cliente</p>
                  <p className="text-xs text-amber-800">{apt.customer_notes}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer actions */}
        {apt && apt.status !== "completed" && (
          <div className="px-5 py-4 border-t border-border-subtle flex-shrink-0 space-y-2">
            {/* Primary: Close comanda */}
            {(apt.status === "confirmed" || apt.status === "in_progress") && (
              <button
                onClick={handleClose}
                disabled={pending || activeItems.length === 0}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                  !pending && activeItems.length > 0
                    ? "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]"
                    : "bg-surface-3 text-text-disabled cursor-not-allowed",
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {pending ? "Processando…" : `Fechar comanda · ${fmt(totalCents)}`}
              </button>
            )}

            {/* Secondary actions */}
            <div className="flex gap-2">
              {apt.status === "confirmed" && (
                <button
                  onClick={() => handleStatusOnly("in_progress")}
                  disabled={pending}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border-default py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-all"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Iniciar
                </button>
              )}
              <button
                onClick={() => handleStatusOnly("no_show")}
                disabled={pending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border-default py-2.5 text-xs font-semibold text-text-secondary hover:bg-surface-2 transition-all"
              >
                <UserMinus className="h-3.5 w-3.5" />
                No-show
              </button>
              <button
                onClick={() => handleStatusOnly("cancelled")}
                disabled={pending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border-default py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-all"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Completed state footer */}
        {apt && apt.status === "completed" && (
          <div className="px-5 py-4 border-t border-border-subtle flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Comanda fechada · {fmt(apt.total_cents)}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
