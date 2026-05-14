"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, X, Phone, Mail, Calendar, Star, Trash2, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { CustomerRow } from "./page";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(cents / 100);
}

function formatDateRelative(iso: string | null) {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff < 30) return `${diff} dias atrás`;
  if (diff < 365) return `${Math.floor(diff / 30)} meses atrás`;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "from-brand-400 to-brand-600",
  "from-coral-300 to-coral-500",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-amber-600",
  "from-emerald-400 to-emerald-600",
];

function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

// ─── Add Customer Modal ────────────────────────────────────────────────────────

function AddCustomerModal({
  venueId,
  onClose,
  onCreated,
}: {
  venueId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const supabase = createClient();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    birth_date: "",
    private_notes: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setError(null);
    startTransition(async () => {
      const { error: err } = await supabase.from("venue_customers").insert({
        venue_id: venueId,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        birth_date: form.birth_date || null,
        private_notes: form.private_notes.trim() || null,
      });
      if (err) { setError(err.message); return; }
      onCreated();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full sm:max-w-md bg-surface-0 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-base font-bold text-text-primary">Novo cliente</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Nome completo *
            </label>
            <input
              autoFocus
              type="text"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="Ana Silva"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Telefone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="ana@email.com"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Data de nascimento</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => update("birth_date", e.target.value)}
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Observações privadas</label>
            <textarea
              value={form.private_notes}
              onChange={(e) => update("private_notes", e.target.value)}
              rows={3}
              placeholder="Notas internas sobre o cliente…"
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

        <div className="px-5 pb-5 pt-3 border-t border-border-subtle flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border-default py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!form.full_name.trim() || pending}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
              form.full_name.trim() && !pending
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-surface-3 text-text-disabled cursor-not-allowed",
            )}
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Customer detail panel ─────────────────────────────────────────────────────

function CustomerDetailPanel({
  customer,
  onClose,
  onDeleted,
}: {
  customer: CustomerRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const supabase = createClient();
  const [deleting, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [appointments, setAppointments] = useState<Array<{
    id: string; scheduled_at: string; status: string; total_cents: number;
    appointment_items: Array<{ description: string }>;
  }> | null>(null);

  useState(() => {
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, total_cents, appointment_items(description)")
      .eq("venue_customer_id", customer.id)
      .order("scheduled_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setAppointments((data ?? []) as typeof appointments));
  });

  function handleDelete() {
    startDelete(async () => {
      await supabase.from("venue_customers").delete().eq("id", customer.id);
      onDeleted();
    });
  }

  const STATUS_LABEL: Record<string, string> = {
    confirmed: "Confirmado", in_progress: "Em andamento",
    completed: "Concluído", cancelled: "Cancelado", no_show: "No-show",
  };
  const STATUS_COLOR: Record<string, string> = {
    confirmed: "text-brand-700", in_progress: "text-amber-700",
    completed: "text-emerald-700", cancelled: "text-red-600", no_show: "text-neutral-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full sm:max-w-lg bg-surface-0 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm", avatarColor(customer.full_name))}>
              {initials(customer.full_name)}
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{customer.full_name}</p>
              <p className="text-xs text-text-tertiary">
                {customer.visit_count} atendimento{customer.visit_count !== 1 ? "s" : ""} · {formatCurrency(customer.total_spent_cents)} total
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-4 border-b border-border-subtle flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-xs text-text-secondary hover:text-brand-700">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" /> {customer.phone}
              </a>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-xs text-text-secondary hover:text-brand-700 truncate">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" /> {customer.email}
              </a>
            )}
            {customer.birth_date && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                {new Date(customer.birth_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </div>
            )}
            {customer.last_visit_at && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Star className="h-3.5 w-3.5 flex-shrink-0" />
                Última visita: {formatDateRelative(customer.last_visit_at)}
              </div>
            )}
          </div>
          {customer.private_notes && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1">Notas privadas</p>
              <p className="text-xs text-amber-800">{customer.private_notes}</p>
            </div>
          )}
        </div>

        {/* Appointment history */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-3">Histórico</p>
          {appointments === null ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-8">Nenhum atendimento registrado</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((apt) => (
                <li key={apt.id} className="flex items-center gap-3 rounded-xl border border-border-subtle px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">
                      {(apt.appointment_items as Array<{ description: string }>)[0]?.description ?? "Atendimento"}
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      <span className={STATUS_COLOR[apt.status] ?? "text-text-tertiary"}>
                        {STATUS_LABEL[apt.status] ?? apt.status}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-text-primary tabular-nums">
                    {formatCurrency(apt.total_cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="flex-1 text-xs text-text-secondary">Confirmar exclusão?</p>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-tertiary hover:text-text-secondary">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-600 text-white text-xs font-semibold px-4 py-2 hover:bg-red-700 transition-all">
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ClientesClient({
  venueId,
  customers: initial,
  stats,
}: {
  venueId: string;
  customers: CustomerRow[];
  stats: { total: number; newThisMonth: number; recurring: number };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const filtered = query.trim()
    ? initial.filter(
        (c) =>
          c.full_name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone?.includes(query) ||
          c.email?.toLowerCase().includes(query.toLowerCase()),
      )
    : initial;

  const avgSpendCents = stats.total > 0
    ? Math.round(initial.reduce((s, c) => s + c.total_spent_cents, 0) / stats.total)
    : 0;

  function onCreated() {
    setShowAdd(false);
    router.refresh();
  }
  function onDeleted() {
    setSelected(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {stats.total} cliente{stats.total !== 1 ? "s" : ""} cadastrado{stats.total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Adicionar cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",           value: stats.total.toString() },
          { label: "Novos este mês",  value: stats.newThisMonth.toString() },
          { label: "Recorrentes",     value: stats.recurring.toString() },
          { label: "Ticket médio",    value: stats.total ? formatCurrency(avgSpendCents) : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border-subtle bg-surface-0 p-4 hover:border-border-default transition-all">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">{label}</p>
            <p className="mt-2 text-2xl font-mono font-bold text-text-primary tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail…"
          className="w-full rounded-xl border border-border-default bg-surface-0 pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
        />
        {query && <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-text-tertiary" /></button>}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-default py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
            <Users className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {initial.length === 0 ? "Nenhum cliente ainda" : "Nenhum resultado"}
          </p>
          <p className="mt-1 text-sm text-text-tertiary max-w-xs">
            {initial.length === 0
              ? "Clientes são adicionados automaticamente ao criar agendamentos."
              : "Tente outros termos na busca."}
          </p>
          {initial.length === 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-5 flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Adicionar manualmente
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-0 overflow-hidden">
          <ul className="divide-y divide-border-subtle">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-1 transition-colors text-left"
                >
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0", avatarColor(c.full_name))}>
                    {initials(c.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{c.full_name}</p>
                    <p className="text-xs text-text-tertiary">
                      {c.phone ?? c.email ?? "Sem contato"}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block flex-shrink-0">
                    <p className="text-xs font-mono font-semibold text-text-primary tabular-nums">{formatCurrency(c.total_spent_cents)}</p>
                    <p className="text-[10px] text-text-tertiary">
                      {c.visit_count} visita{c.visit_count !== 1 ? "s" : ""} · {formatDateRelative(c.last_visit_at)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAdd && (
        <AddCustomerModal venueId={venueId} onClose={() => setShowAdd(false)} onCreated={onCreated} />
      )}
      {selected && (
        <CustomerDetailPanel customer={selected} onClose={() => setSelected(null)} onDeleted={onDeleted} />
      )}
    </div>
  );
}
