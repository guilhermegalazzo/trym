"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, User, Scissors, Clock,
  CreditCard, Search, Plus, X, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Service    = { id: string; name: string; price_cents: number; duration_minutes: number };
type TeamMember = { id: string; display_name: string; avatar_url: string | null };

interface Draft {
  venueCustomerId: string | null;
  customerName: string;
  customerPhone: string;
  customerIsNew: boolean;
  selectedServices: Service[];
  teamMemberId: string | null;
  scheduledDate: string;
  scheduledTime: string;
  paymentMethod: string;
  notes: string;
}

type Step = "customer" | "services" | "datetime" | "payment" | "confirm";

const STEPS: Step[] = ["customer", "services", "datetime", "payment", "confirm"];

const STEP_META: Record<Step, { label: string; icon: React.ElementType }> = {
  customer: { label: "Cliente",     icon: User },
  services: { label: "Serviços",   icon: Scissors },
  datetime: { label: "Data e hora", icon: Clock },
  payment:  { label: "Pagamento",  icon: CreditCard },
  confirm:  { label: "Confirmar",  icon: CheckCircle2 },
};

const PAYMENT_METHODS = [
  { value: "cash",      label: "Dinheiro" },
  { value: "pix",       label: "PIX" },
  { value: "debit",     label: "Débito" },
  { value: "credit",    label: "Crédito" },
  { value: "on_credit", label: "Fiado" },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

// ─── Main component ────────────────────────────────────────────────────────────

export function NovoAgendamentoClient({
  venueId,
  services,
  teamMembers,
}: {
  venueId: string;
  services: Service[];
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("customer");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [draft, setDraft] = useState<Draft>({
    venueCustomerId: null,
    customerName: "",
    customerPhone: "",
    customerIsNew: false,
    selectedServices: [],
    teamMemberId: null,
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "09:00",
    paymentMethod: "cash",
    notes: "",
  });

  const stepIdx   = STEPS.indexOf(step);
  const totalCents   = draft.selectedServices.reduce((s, sv) => s + sv.price_cents, 0);
  const totalMinutes = draft.selectedServices.reduce((s, sv) => s + sv.duration_minutes, 0);

  function update(patch: Partial<Draft>) {
    setDraft(d => ({ ...d, ...patch }));
  }

  function canAdvance(): boolean {
    if (step === "customer") return !!(draft.venueCustomerId || (draft.customerIsNew && draft.customerName.trim()));
    if (step === "services") return draft.selectedServices.length > 0;
    if (step === "datetime") return !!(draft.scheduledDate && draft.scheduledTime);
    return true;
  }

  function next() {
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1]);
  }
  function prev() {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
    else router.back();
  }

  async function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        let customerId = draft.venueCustomerId;
        if (!customerId) {
          const { data: nc, error: ce } = await supabase
            .from("venue_customers")
            .insert({ venue_id: venueId, full_name: draft.customerName.trim(), phone: draft.customerPhone || null })
            .select("id").single();
          if (ce) throw new Error(ce.message);
          customerId = nc.id;
        }

        const scheduledAt = new Date(`${draft.scheduledDate}T${draft.scheduledTime}:00`).toISOString();

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
            customer_notes: draft.notes || null,
          })
          .select("id").single();
        if (ae) throw new Error(ae.message);

        if (draft.selectedServices.length > 0) {
          const items = draft.selectedServices.map(sv => ({
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

        router.push(`/agendamentos/${apt.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao criar agendamento");
      }
    });
  }

  // ── Step content ──────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case "customer": return <StepCustomer />;
      case "services": return <StepServices />;
      case "datetime": return <StepDatetime />;
      case "payment":  return <StepPayment />;
      case "confirm":  return <StepConfirm />;
    }
  }

  // ── Customer ──────────────────────────────────────────────────────────────────

  function StepCustomer() {
    const [searching, setSearching] = useState(false);
    const [results, setResults]     = useState<Array<{ id: string; full_name: string; phone: string | null }>>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    async function search(q: string) {
      if (q.length < 2) { setResults([]); return; }
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

    const isSelected = draft.venueCustomerId !== null || (draft.customerIsNew && draft.customerName);

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            autoFocus
            type="text"
            value={customerSearch}
            onChange={e => onInput(e.target.value)}
            placeholder="Buscar por nome ou telefone…"
            className="w-full rounded-xl border border-border-default bg-surface-1 pl-9 pr-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
          />
        </div>

        {isSelected && (
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-200 px-4 py-3">
            <User className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <span className="text-sm font-medium text-brand-800 flex-1">
              {draft.customerIsNew ? `Novo: ${draft.customerName}` : draft.customerName}
            </span>
            <button onClick={() => update({ venueCustomerId: null, customerName: "", customerPhone: "", customerIsNew: false })}>
              <X className="h-3.5 w-3.5 text-brand-400 hover:text-brand-600" />
            </button>
          </div>
        )}

        {results.length > 0 && !isSelected && (
          <ul className="rounded-xl border border-border-default overflow-hidden divide-y divide-border-subtle">
            {results.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => { update({ venueCustomerId: c.id, customerName: c.full_name, customerPhone: c.phone ?? "", customerIsNew: false }); setResults([]); }}
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
            onClick={() => update({ venueCustomerId: null, customerName: customerSearch, customerPhone: "", customerIsNew: true })}
            className="w-full flex items-center gap-2 rounded-xl border border-dashed border-border-default px-4 py-3 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
          >
            <Plus className="h-4 w-4 text-brand-600" />
            Criar novo: &quot;{customerSearch}&quot;
          </button>
        )}

        {draft.customerIsNew && (
          <div className="space-y-3">
            <input
              type="text"
              value={draft.customerName}
              onChange={e => update({ customerName: e.target.value })}
              placeholder="Nome completo"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
            <input
              type="tel"
              value={draft.customerPhone}
              onChange={e => update({ customerPhone: e.target.value })}
              placeholder="Telefone (opcional)"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
        )}
      </div>
    );
  }

  // ── Services ──────────────────────────────────────────────────────────────────

  function StepServices() {
    const [q, setQ] = useState("");
    const filtered = services.filter(s => !q.trim() || s.name.toLowerCase().includes(q.toLowerCase()));

    function toggle(sv: Service) {
      const already = draft.selectedServices.some(s => s.id === sv.id);
      update({ selectedServices: already ? draft.selectedServices.filter(s => s.id !== sv.id) : [...draft.selectedServices, sv] });
    }

    return (
      <div className="space-y-3">
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Filtrar serviços…"
          className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
        />
        {services.length === 0 ? (
          <p className="text-center py-8 text-sm text-text-tertiary">Nenhum serviço cadastrado ainda.</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-text-tertiary">Nenhum resultado.</p>
        ) : (
          <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {filtered.map(sv => {
              const sel = draft.selectedServices.some(s => s.id === sv.id);
              return (
                <li key={sv.id}>
                  <button
                    onClick={() => toggle(sv)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      sel ? "border-brand-600 bg-brand-50" : "border-border-default bg-surface-0 hover:bg-surface-1",
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      sel ? "border-brand-600 bg-brand-600" : "border-border-strong",
                    )}>
                      {sel && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium", sel ? "text-brand-800" : "text-text-primary")}>{sv.name}</div>
                      <div className="text-xs text-text-tertiary">{sv.duration_minutes} min</div>
                    </div>
                    <div className={cn("text-sm font-semibold tabular-nums", sel ? "text-brand-700" : "text-text-secondary")}>
                      {formatCurrency(sv.price_cents)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {teamMembers.length > 0 && (
          <div className="pt-2">
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-2">Profissional (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {[{ id: null as null, display_name: "Qualquer" }, ...teamMembers].map(tm => (
                <button
                  key={tm.id ?? "any"}
                  onClick={() => update({ teamMemberId: tm.id })}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                    draft.teamMemberId === tm.id
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-border-default text-text-secondary hover:bg-surface-2",
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

  // ── Datetime ──────────────────────────────────────────────────────────────────

  function StepDatetime() {
    const times: string[] = [];
    for (let h = 7; h <= 21; h++)
      for (const m of [0, 30])
        times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);

    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-2">Data</label>
          <input
            type="date"
            value={draft.scheduledDate}
            onChange={e => update({ scheduledDate: e.target.value })}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-2">Horário</label>
          <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
            {times.map(t => (
              <button
                key={t}
                onClick={() => update({ scheduledTime: t })}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium tabular-nums transition-all",
                  draft.scheduledTime === t
                    ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : "border-border-default text-text-secondary hover:bg-surface-2",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Payment ───────────────────────────────────────────────────────────────────

  function StepPayment() {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-2">Forma de pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.value}
                onClick={() => update({ paymentMethod: pm.value })}
                className={cn(
                  "rounded-xl border py-3 text-sm font-semibold transition-all",
                  draft.paymentMethod === pm.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-border-default text-text-secondary hover:bg-surface-2",
                )}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-2">Observações (opcional)</label>
          <textarea
            value={draft.notes}
            onChange={e => update({ notes: e.target.value })}
            rows={3}
            placeholder="Anotações sobre o agendamento…"
            className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 resize-none transition-all"
          />
        </div>
      </div>
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────────

  function StepConfirm() {
    const tm = teamMembers.find(t => t.id === draft.teamMemberId);
    const dateStr = new Date(`${draft.scheduledDate}T${draft.scheduledTime}:00`).toLocaleString("pt-BR", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });
    const pm = PAYMENT_METHODS.find(p => p.value === draft.paymentMethod)?.label ?? draft.paymentMethod;

    return (
      <div className="space-y-3">
        <Row label="Cliente" value={draft.customerName} />
        {tm && <Row label="Profissional" value={tm.display_name} />}
        <Row label="Data e hora" value={dateStr} />
        <Row label="Duração" value={`${totalMinutes} min`} />
        <div className="rounded-xl border border-border-subtle bg-surface-0 p-4">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Serviços</p>
          {draft.selectedServices.map(sv => (
            <div key={sv.id} className="flex justify-between text-sm py-0.5">
              <span className="text-text-primary">{sv.name}</span>
              <span className="text-text-secondary tabular-nums">{formatCurrency(sv.price_cents)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t border-border-subtle">
            <span className="text-text-primary">Total</span>
            <span className="text-brand-700 tabular-nums">{formatCurrency(totalCents)}</span>
          </div>
        </div>
        <Row label="Pagamento" value={pm} />
        {draft.notes && <Row label="Observações" value={draft.notes} />}
      </div>
    );
  }

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-0 px-4 py-3 flex justify-between items-start gap-4">
        <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex-shrink-0">{label}</span>
        <span className="text-sm text-text-primary text-right capitalize">{value}</span>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Novo agendamento</h1>
        <p className="text-sm text-text-secondary mt-0.5">Preencha os dados do agendamento</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = STEP_META[s].icon;
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all flex-shrink-0",
                active ? "border-brand-600 bg-brand-600 text-white" :
                done   ? "border-brand-600 bg-brand-50 text-brand-600" :
                         "border-border-default text-text-disabled",
              )}>
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-1 transition-colors", done ? "bg-brand-400" : "bg-border-default")} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider -mt-2">
        {STEP_META[step].label}
      </p>

      {/* Step card */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 p-6">
        {renderStep()}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={prev}
          className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-0 px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {stepIdx === 0 ? "Cancelar" : "Voltar"}
        </button>

        {step !== "confirm" ? (
          <button
            onClick={next}
            disabled={!canAdvance()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Criando…" : "Confirmar agendamento"}
            {!pending && <CheckCircle2 className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
