"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Clock, User, Scissors, CreditCard,
  Phone, CheckCircle2, Circle, Ban, UserMinus, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Apt = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  total_cents: number;
  payment_method: string | null;
  payment_status: string | null;
  customer_notes: string | null;
  venue_customers: { id: string; full_name: string; phone: string | null; email: string | null } | null;
  team_members: { id: string; display_name: string; avatar_url: string | null } | null;
  appointment_items: Array<{ id: string; description: string; total_cents: number }>;
};

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  confirmed:   { label: "Confirmado",    bg: "bg-brand-50",    text: "text-brand-700",   icon: CheckCircle2 },
  in_progress: { label: "Em andamento",  bg: "bg-amber-50",    text: "text-amber-700",   icon: Circle },
  completed:   { label: "Concluído",     bg: "bg-emerald-50",  text: "text-emerald-700", icon: CheckCircle2 },
  cancelled:   { label: "Cancelado",     bg: "bg-red-50",      text: "text-red-600",     icon: Ban },
  no_show:     { label: "Não compareceu",bg: "bg-neutral-100", text: "text-neutral-500", icon: UserMinus },
};

const STATUS_ACTIONS: Record<string, Array<{ value: string; label: string }>> = {
  confirmed:   [{ value: "in_progress", label: "Iniciar atendimento" }, { value: "no_show", label: "Não compareceu" }, { value: "cancelled", label: "Cancelar" }],
  in_progress: [{ value: "completed", label: "Concluir" }, { value: "cancelled", label: "Cancelar" }],
  completed:   [],
  cancelled:   [],
  no_show:     [{ value: "confirmed", label: "Restaurar" }],
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Dinheiro", pix: "PIX", debit: "Débito", credit: "Crédito", on_credit: "Fiado",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
      <Icon className="h-4 w-4 text-text-tertiary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-text-primary">{children}</div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AgendamentoDetalheClient({ apt }: { apt: Apt }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(apt.status);
  const [pending, startTransition] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [delConfirm, setDelConfirm] = useState(false);

  const cfg = STATUS_CFG[status] ?? STATUS_CFG.confirmed;
  const Icon = cfg.icon;
  const actions = STATUS_ACTIONS[status] ?? [];

  function changeStatus(newStatus: string) {
    setError(null);
    startTransition(async () => {
      const { error: e } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", apt.id);
      if (e) { setError(e.message); return; }
      setStatus(newStatus);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const { error: e } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", apt.id);
      if (e) { setError(e.message); return; }
      router.push("/agendamentos");
    });
  }

  const endTime = new Date(new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60_000)
    .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back + title */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-0.5 rounded-xl border border-border-default p-2.5 hover:bg-surface-2 transition-colors">
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary leading-tight">
            {apt.venue_customers?.full_name ?? "Cliente"}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5 capitalize">{fmtDate(apt.scheduled_at)}</p>
        </div>
      </div>

      {/* Status badge + actions */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
            cfg.bg, cfg.text,
          )}>
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </span>
          <span className="text-xs text-text-tertiary">#{apt.id.slice(0, 8)}</span>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map(a => (
              <button
                key={a.value}
                onClick={() => changeStatus(a.value)}
                disabled={pending}
                className={cn(
                  "rounded-xl border px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50",
                  a.value === "cancelled" || a.value === "no_show"
                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 px-5 py-1">
        <InfoRow icon={Calendar} label="Data e hora">
          <span className="capitalize">{fmtDate(apt.scheduled_at)}</span>
          <span className="text-text-tertiary"> → {endTime}</span>
        </InfoRow>
        <InfoRow icon={Clock} label="Duração">
          {apt.duration_minutes} minutos
        </InfoRow>
        {apt.team_members && (
          <InfoRow icon={User} label="Profissional">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{initials(apt.team_members.display_name)}</span>
              </div>
              {apt.team_members.display_name}
            </div>
          </InfoRow>
        )}
      </div>

      {/* Customer card */}
      {apt.venue_customers && (
        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">Cliente</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-coral-300 to-coral-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">{initials(apt.venue_customers.full_name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{apt.venue_customers.full_name}</p>
              {apt.venue_customers.phone && (
                <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />{apt.venue_customers.phone}
                </p>
              )}
            </div>
            <Link
              href={`/clientes?id=${apt.venue_customers.id}`}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Ver perfil
            </Link>
          </div>
        </div>
      )}

      {/* Services + price */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Scissors className="h-3.5 w-3.5" /> Serviços
        </p>
        {apt.appointment_items.length === 0 ? (
          <p className="text-sm text-text-tertiary">Nenhum serviço registrado.</p>
        ) : (
          <div className="space-y-1.5">
            {apt.appointment_items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-text-primary">{item.description}</span>
                <span className="tabular-nums text-text-secondary">{fmt(item.total_cents)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-border-subtle">
              <span>Total</span>
              <span className="text-brand-700 tabular-nums">{fmt(apt.total_cents)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> Pagamento
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-primary">
            {apt.payment_method ? (METHOD_LABEL[apt.payment_method] ?? apt.payment_method) : "Não informado"}
          </span>
          <span className={cn(
            "text-xs font-semibold rounded-full px-2.5 py-1",
            apt.payment_status === "paid"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}>
            {apt.payment_status === "paid" ? "Pago" : "Pendente"}
          </span>
        </div>
      </div>

      {/* Notes */}
      {apt.customer_notes && (
        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Observações</p>
          <p className="text-sm text-text-primary whitespace-pre-line">{apt.customer_notes}</p>
        </div>
      )}

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3">Zona de risco</p>
        {!delConfirm ? (
          <button
            onClick={() => setDelConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Cancelar agendamento
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-700 font-medium">Confirmar cancelamento?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={pending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Sim, cancelar
              </button>
              <button
                onClick={() => setDelConfirm(false)}
                className="rounded-xl border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-colors"
              >
                Não
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
