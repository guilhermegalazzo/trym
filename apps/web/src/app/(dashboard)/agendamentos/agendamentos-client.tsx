"use client";
/* eslint-disable react-hooks/static-components */

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, X, ChevronRight, ChevronLeft,
  CalendarCheck2, User, Scissors, Clock, CreditCard,
  CheckCircle2, Circle, AlertCircle, Ban, UserMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentRow, ServiceRow, TeamMemberRow } from "./page";
import { createClient } from "@/lib/supabase/client";
import { ComandaModal } from "./comanda-modal";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
  confirmed:   { label: "Confirmado",   bg: "bg-brand-50",   text: "text-brand-700",   icon: CheckCircle2 },
  in_progress: { label: "Em andamento", bg: "bg-amber-50",   text: "text-amber-700",   icon: Circle },
  completed:   { label: "Concluído",    bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  cancelled:   { label: "Cancelado",    bg: "bg-red-50",     text: "text-red-600",     icon: Ban },
  no_show:     { label: "No-show",      bg: "bg-neutral-100","text": "text-neutral-500", icon: UserMinus },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

// ─── Tab filter logic ──────────────────────────────────────────────────────────

type TabKey = "all" | "today" | "confirmed" | "completed" | "cancelled";
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "all",       label: "Todos"       },
  { key: "today",     label: "Hoje"        },
  { key: "confirmed", label: "Confirmados" },
  { key: "completed", label: "Concluídos"  },
  { key: "cancelled", label: "Cancelados"  },
];

function filterAppointments(
  apts: AppointmentRow[],
  tab: TabKey,
  query: string,
): AppointmentRow[] {
  let result = apts;
  if (tab === "today")     result = result.filter((a) => isToday(a.scheduled_at));
  if (tab === "confirmed") result = result.filter((a) => a.status === "confirmed" || a.status === "in_progress");
  if (tab === "completed") result = result.filter((a) => a.status === "completed");
  if (tab === "cancelled") result = result.filter((a) => a.status === "cancelled" || a.status === "no_show");
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (a) =>
        a.venue_customers?.full_name.toLowerCase().includes(q) ||
        a.appointment_items.some((i) => i.description.toLowerCase().includes(q)),
    );
  }
  return result;
}

// ─── Modal step types ──────────────────────────────────────────────────────────

type ModalStep = "customer" | "services" | "datetime" | "payment" | "confirm";

interface DraftAppointment {
  venueCustomerId: string | null;
  customerName: string;
  customerPhone: string;
  customerIsNew: boolean;
  selectedServices: ServiceRow[];
  teamMemberId: string | null;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  paymentMethod: string;
}

const PAYMENT_METHODS = [
  { value: "cash",    label: "Dinheiro" },
  { value: "pix",     label: "PIX" },
  { value: "debit",   label: "Débito" },
  { value: "credit",  label: "Crédito" },
  { value: "on_credit", label: "Fiado" },
];

const STEP_LABELS: Record<ModalStep, string> = {
  customer: "Cliente",
  services: "Serviços",
  datetime: "Data e hora",
  payment:  "Pagamento",
  confirm:  "Confirmar",
};
const STEP_ICONS: Record<ModalStep, React.ElementType> = {
  customer: User,
  services: Scissors,
  datetime: Clock,
  payment:  CreditCard,
  confirm:  CheckCircle2,
};
const STEPS: ModalStep[] = ["customer", "services", "datetime", "payment", "confirm"];

// ─── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({
  venueId,
  services,
  teamMembers,
  onClose,
  onCreated,
}: {
  venueId: string;
  services: ServiceRow[];
  teamMembers: TeamMemberRow[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<ModalStep>("customer");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [draft, setDraft] = useState<DraftAppointment>({
    venueCustomerId: null,
    customerName: "",
    customerPhone: "",
    customerIsNew: false,
    selectedServices: [],
    teamMemberId: null,
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "09:00",
    paymentMethod: "cash",
  });

  const supabase = createClient();

  const currentStepIdx = STEPS.indexOf(step);
  const totalCents = draft.selectedServices.reduce((s, sv) => s + sv.price_cents, 0);
  const totalMinutes = draft.selectedServices.reduce((s, sv) => s + sv.duration_minutes, 0);

  function update(patch: Partial<DraftAppointment>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        // 1. Ensure venue_customer exists
        let customerId = draft.venueCustomerId;
        if (!customerId) {
          const { data: newCustomer, error: ce } = await supabase
            .from("venue_customers")
            .insert({
              venue_id: venueId,
              full_name: draft.customerName,
              phone: draft.customerPhone || null,
            })
            .select("id")
            .single();
          if (ce) throw new Error(ce.message);
          customerId = newCustomer.id;
        }

        // 2. Build scheduledAt
        const scheduledAt = new Date(`${draft.scheduledDate}T${draft.scheduledTime}:00`).toISOString();

        // 3. Create appointment
        const { data: apt, error: ae } = await supabase
          .from("appointments")
          .insert({
            venue_id: venueId,
            venue_customer_id: customerId,
            team_member_id: draft.teamMemberId || null,
            scheduled_at: scheduledAt,
            duration_minutes: totalMinutes || 60,
            total_cents: totalCents,
            payment_method: draft.paymentMethod,
            status: "confirmed",
            source: "manual",
          })
          .select("id")
          .single();
        if (ae) throw new Error(ae.message);

        // 4. Create appointment_items
        if (draft.selectedServices.length > 0) {
          const items = draft.selectedServices.map((sv) => ({
            appointment_id: apt.id,
            service_id: sv.id,
            description: sv.name,
            quantity: 1,
            unit_price_cents: sv.price_cents,
            total_cents: sv.price_cents,
            team_member_id: draft.teamMemberId || null,
          }));
          const { error: ie } = await supabase.from("appointment_items").insert(items);
          if (ie) throw new Error(ie.message);
        }

        onCreated();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao criar agendamento");
      }
    });
  }

  // ── Customer step ───────────────────────────────────────────────────────────
  function StepCustomer() {
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<Array<{ id: string; full_name: string; phone: string | null }>>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    async function search(q: string) {
      if (!q.trim() || q.length < 2) { setResults([]); return; }
      setSearching(true);
      const { data } = await supabase
        .from("venue_customers")
        .select("id, full_name, phone")
        .eq("venue_id", venueId)
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(8);
      setResults(data ?? []);
      setSearching(false);
    }

    function onInput(v: string) {
      setCustomerSearch(v);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => search(v), 300);
    }

    function selectExisting(c: { id: string; full_name: string; phone: string | null }) {
      update({ venueCustomerId: c.id, customerName: c.full_name, customerPhone: c.phone ?? "", customerIsNew: false });
      setStep("services");
    }

    function createNew() {
      update({ venueCustomerId: null, customerName: customerSearch, customerPhone: "", customerIsNew: true });
      setStep("services");
    }

    const isSelected = draft.venueCustomerId !== null || (draft.customerIsNew && draft.customerName);

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            autoFocus
            type="text"
            value={customerSearch}
            onChange={(e) => onInput(e.target.value)}
            placeholder="Buscar por nome ou telefone…"
            className="w-full rounded-xl border border-border-default bg-surface-1 pl-9 pr-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
          />
        </div>

        {isSelected && (
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-200 px-4 py-3">
            <User className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <span className="text-sm font-medium text-brand-800 flex-1">
              {draft.customerIsNew ? `Novo: ${draft.customerName}` : draft.customerName}
            </span>
            <button onClick={() => update({ venueCustomerId: null, customerName: "", customerPhone: "", customerIsNew: false })} className="text-brand-400 hover:text-brand-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {results.length > 0 && !isSelected && (
          <ul className="rounded-xl border border-border-default overflow-hidden divide-y divide-border-subtle">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => selectExisting(c)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors"
                >
                  <div className="text-sm font-medium text-text-primary">{c.full_name}</div>
                  {c.phone && <div className="text-xs text-text-tertiary">{c.phone}</div>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {customerSearch.trim().length >= 2 && !searching && !isSelected && (
          <button
            onClick={createNew}
            className="w-full flex items-center gap-2 rounded-xl border border-dashed border-border-default px-4 py-3 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
          >
            <Plus className="h-4 w-4 text-brand-600" />
            Criar novo cliente &quot;{customerSearch}&quot;
          </button>
        )}

        {draft.customerIsNew && (
          <div className="space-y-3">
            <input
              type="text"
              value={draft.customerName}
              onChange={(e) => update({ customerName: e.target.value })}
              placeholder="Nome completo"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
            <input
              type="tel"
              value={draft.customerPhone}
              onChange={(e) => update({ customerPhone: e.target.value })}
              placeholder="Telefone (opcional)"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
        )}
      </div>
    );
  }

  // ── Services step ───────────────────────────────────────────────────────────
  function StepServices() {
    const [q, setQ] = useState("");
    const filtered = services.filter((s) =>
      !q.trim() || s.name.toLowerCase().includes(q.toLowerCase()),
    );
    function toggle(sv: ServiceRow) {
      const already = draft.selectedServices.some((s) => s.id === sv.id);
      update({
        selectedServices: already
          ? draft.selectedServices.filter((s) => s.id !== sv.id)
          : [...draft.selectedServices, sv],
      });
    }
    return (
      <div className="space-y-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar serviços…"
          className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
        />
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-text-tertiary">Nenhum serviço encontrado</p>
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-y-auto">
            {filtered.map((sv) => {
              const selected = draft.selectedServices.some((s) => s.id === sv.id);
              return (
                <li key={sv.id}>
                  <button
                    onClick={() => toggle(sv)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      selected
                        ? "border-brand-600 bg-brand-50"
                        : "border-border-default bg-surface-0 hover:bg-surface-1",
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      selected ? "border-brand-600 bg-brand-600" : "border-border-strong",
                    )}>
                      {selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium", selected ? "text-brand-800" : "text-text-primary")}>
                        {sv.name}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {sv.duration_minutes} min · {formatCurrency(sv.price_cents)}
                      </div>
                    </div>
                    <div className={cn("text-sm font-mono font-semibold tabular-nums", selected ? "text-brand-700" : "text-text-secondary")}>
                      {formatCurrency(sv.price_cents)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {draft.selectedServices.length > 0 && (
          <div className="rounded-xl bg-surface-2 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {draft.selectedServices.length} serviço(s) · {totalMinutes} min
            </span>
            <span className="text-sm font-mono font-bold text-text-primary tabular-nums">
              {formatCurrency(totalCents)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── DateTime step ───────────────────────────────────────────────────────────
  function StepDateTime() {
    const times: string[] = [];
    for (let h = 7; h <= 20; h++) {
      for (const m of [0, 30]) {
        times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return (
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
            Data
          </label>
          <input
            type="date"
            value={draft.scheduledDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => update({ scheduledDate: e.target.value })}
            className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
            Horário
          </label>
          <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto">
            {times.map((t) => (
              <button
                key={t}
                onClick={() => update({ scheduledTime: t })}
                className={cn(
                  "rounded-lg py-2 text-xs font-mono font-medium transition-all",
                  draft.scheduledTime === t
                    ? "bg-brand-600 text-white"
                    : "border border-border-default text-text-secondary hover:bg-surface-2",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {teamMembers.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
              Profissional (opcional)
            </label>
            <div className="space-y-1.5">
              <button
                onClick={() => update({ teamMemberId: null })}
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-2.5 text-sm transition-all",
                  !draft.teamMemberId
                    ? "border-brand-600 bg-brand-50 text-brand-800 font-medium"
                    : "border-border-default text-text-secondary hover:bg-surface-1",
                )}
              >
                Qualquer profissional
              </button>
              {teamMembers.map((tm) => (
                <button
                  key={tm.id}
                  onClick={() => update({ teamMemberId: tm.id })}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-2.5 text-sm transition-all",
                    draft.teamMemberId === tm.id
                      ? "border-brand-600 bg-brand-50 text-brand-800 font-medium"
                      : "border-border-default text-text-secondary hover:bg-surface-1",
                  )}
                >
                  {tm.display_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Payment step ────────────────────────────────────────────────────────────
  function StepPayment() {
    return (
      <div className="space-y-2">
        {PAYMENT_METHODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update({ paymentMethod: value })}
            className={cn(
              "w-full text-left rounded-xl border px-4 py-3 text-sm transition-all",
              draft.paymentMethod === value
                ? "border-brand-600 bg-brand-50 text-brand-800 font-medium"
                : "border-border-default text-text-secondary hover:bg-surface-1",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  // ── Confirm step ────────────────────────────────────────────────────────────
  function StepConfirm() {
    const tm = teamMembers.find((t) => t.id === draft.teamMemberId);
    const payment = PAYMENT_METHODS.find((p) => p.value === draft.paymentMethod);
    const scheduledAt = new Date(`${draft.scheduledDate}T${draft.scheduledTime}:00`);

    const rows: Array<{ label: string; value: string }> = [
      { label: "Cliente",        value: draft.customerName || "—" },
      { label: "Data e hora",    value: scheduledAt.toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) },
      { label: "Duração",        value: `${totalMinutes} min` },
      { label: "Profissional",   value: tm?.display_name ?? "Qualquer" },
      { label: "Pagamento",      value: payment?.label ?? "—" },
      { label: "Total",          value: formatCurrency(totalCents) },
    ];

    return (
      <div className="space-y-4">
        <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle overflow-hidden">
          {rows.map(({ label, value }) => (
            <li key={label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">{label}</span>
              <span className="text-sm font-medium text-text-primary">{value}</span>
            </li>
          ))}
        </ul>

        {draft.selectedServices.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">Serviços</p>
            <ul className="space-y-1">
              {draft.selectedServices.map((sv) => (
                <li key={sv.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{sv.name}</span>
                  <span className="font-mono text-text-primary tabular-nums">{formatCurrency(sv.price_cents)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Step validation ─────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === "customer")  return !!(draft.venueCustomerId || (draft.customerIsNew && draft.customerName.trim()));
    if (step === "services")  return draft.selectedServices.length > 0;
    if (step === "datetime")  return !!(draft.scheduledDate && draft.scheduledTime);
    if (step === "payment")   return !!draft.paymentMethod;
    return true;
  }

  function goNext() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function goBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-md bg-surface-0 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Step indicator */}
        <div className="flex border-b border-border-subtle">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[s];
            const active = s === step;
            const done = STEPS.indexOf(step) > i;
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-1 py-3">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                  active ? "bg-brand-600 text-white" : done ? "bg-brand-100 text-brand-700" : "bg-surface-2 text-text-tertiary",
                )}>
                  <Icon className="h-3 w-3" strokeWidth={2.5} />
                </div>
                <span className={cn(
                  "text-[9px] font-semibold uppercase tracking-wide hidden sm:block",
                  active ? "text-brand-700" : "text-text-tertiary",
                )}>{STEP_LABELS[s]}</span>
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {STEP_LABELS[step]}
            </h2>
            <p className="text-xs text-text-tertiary">
              Passo {currentStepIdx + 1} de {STEPS.length}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "customer" && <StepCustomer />}
          {step === "services" && <StepServices />}
          {step === "datetime" && <StepDateTime />}
          {step === "payment"  && <StepPayment />}
          {step === "confirm"  && <StepConfirm />}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 pb-5 pt-4 border-t border-border-subtle">
          {currentStepIdx > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 rounded-xl border border-border-default px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          <button
            onClick={step === "confirm" ? handleSubmit : goNext}
            disabled={!canAdvance() || pending}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all",
              canAdvance() && !pending
                ? "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]"
                : "bg-surface-3 text-text-disabled cursor-not-allowed",
            )}
          >
            {pending ? "Criando…" : step === "confirm" ? "Confirmar agendamento" : (
              <>Avançar <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment card ──────────────────────────────────────────────────────────

function AppointmentCard({ apt, onClick }: { apt: AppointmentRow; onClick: () => void }) {
  const s = STATUS[apt.status];
  const StatusIcon = s.icon;
  const serviceName = apt.appointment_items[0]?.description ?? "Serviço";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-4 rounded-2xl border border-border-subtle bg-surface-0 px-5 py-4 hover:border-border-default hover:shadow-sm transition-all text-left group"
    >
      {/* Time column */}
      <div className="flex-shrink-0 w-14 text-center pt-0.5">
        <div className="text-xs font-mono font-bold text-brand-700">{formatTime(apt.scheduled_at)}</div>
        <div className="text-[10px] text-text-tertiary leading-tight">{formatDateShort(apt.scheduled_at)}</div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-text-primary truncate">
            {apt.venue_customers?.full_name ?? "Cliente"}
          </p>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0", s.bg, s.text)}>
            <StatusIcon className="h-3 w-3" strokeWidth={2} />
            {s.label}
          </span>
        </div>
        <p className="text-xs text-text-secondary truncate">
          {serviceName}
          {apt.team_members && ` · ${apt.team_members.display_name}`}
          {" · "}
          {apt.duration_minutes} min
        </p>
        {apt.venue_customers?.phone && (
          <p className="text-xs text-text-tertiary mt-0.5">{apt.venue_customers.phone}</p>
        )}
      </div>

      {/* Price + chevron */}
      <div className="flex-shrink-0 text-right flex items-center gap-2">
        <div>
          <div className="text-sm font-mono font-bold text-text-primary tabular-nums">
            {formatCurrency(apt.total_cents)}
          </div>
          {apt.payment_method && (
            <div className="text-[10px] text-text-tertiary capitalize">{apt.payment_method}</div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-text-secondary transition-colors" />
      </div>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AgendamentosClient({
  venueId,
  appointments,
  services,
  teamMembers,
}: {
  venueId: string;
  appointments: AppointmentRow[];
  services: ServiceRow[];
  teamMembers: TeamMemberRow[];
}) {
  const router = useRouter();
  const supabaseRt = createClient();
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [comandaAptId, setComandaAptId] = useState<string | null>(null);

  // Real-time subscription — refresh server data on any appointment change
  useEffect(() => {
    const channel = supabaseRt
      .channel("apts-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `venue_id=eq.${venueId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => { supabaseRt.removeChannel(channel); };
  }, [venueId]);

  const filtered = filterAppointments(appointments, tab, query);

  function handleCreated() {
    setShowModal(false);
    router.refresh();
  }
  function handleComandaUpdated() {
    setComandaAptId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Agendamentos</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {appointments.length} agendamento{appointments.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Novo agendamento
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por cliente ou serviço…"
          className="w-full rounded-xl border border-border-default bg-surface-0 pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border-subtle">
        {TABS.map(({ key, label }) => {
          const count = key === "all"
            ? appointments.length
            : filterAppointments(appointments, key, "").length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
                tab === key
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-text-tertiary hover:text-text-secondary",
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn(
                  "ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                  tab === key ? "bg-brand-100 text-brand-700" : "bg-surface-3 text-text-tertiary",
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-default py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
            <CalendarCheck2 className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {appointments.length === 0 ? "Nenhum agendamento ainda" : "Nenhum resultado encontrado"}
          </p>
          <p className="mt-1 text-sm text-text-tertiary max-w-xs">
            {appointments.length === 0
              ? "Crie o primeiro agendamento para começar."
              : "Tente ajustar os filtros ou a busca."}
          </p>
          {appointments.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Criar agendamento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} onClick={() => setComandaAptId(apt.id)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <CreateModal
          venueId={venueId}
          services={services}
          teamMembers={teamMembers}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Comanda Modal */}
      {comandaAptId && (
        <ComandaModal
          appointmentId={comandaAptId}
          venueId={venueId}
          services={services}
          onClose={() => setComandaAptId(null)}
          onUpdated={handleComandaUpdated}
        />
      )}
    </div>
  );
}
