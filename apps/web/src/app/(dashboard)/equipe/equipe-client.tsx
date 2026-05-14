"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Plus, X, Pencil, Trash2, Check, AlertCircle, CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { TeamMemberFull } from "./page";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const GRADIENT_OPTIONS = [
  "from-brand-400 to-brand-600",
  "from-coral-300 to-coral-500",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-amber-600",
  "from-emerald-400 to-emerald-600",
  "from-sky-400 to-sky-600",
];
function memberGradient(name: string) {
  return GRADIENT_OPTIONS[name.charCodeAt(0) % GRADIENT_OPTIONS.length];
}

// ─── Member Form Modal ─────────────────────────────────────────────────────────

interface MemberFormData {
  display_name: string;
  role: string;
  bio: string;
  commission_percentage: string;
  is_active: boolean;
}

const EMPTY_FORM: MemberFormData = {
  display_name: "",
  role: "",
  bio: "",
  commission_percentage: "0",
  is_active: true,
};

function MemberModal({
  venueId,
  editing,
  onClose,
  onSaved,
}: {
  venueId: string;
  editing: TeamMemberFull | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MemberFormData>(
    editing
      ? {
          display_name: editing.display_name,
          role: editing.role ?? "",
          bio: editing.bio ?? "",
          commission_percentage: editing.commission_percentage.toString(),
          is_active: editing.is_active,
        }
      : EMPTY_FORM,
  );

  function update(key: keyof MemberFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.display_name.trim()) return;
    setError(null);
    const payload = {
      display_name: form.display_name.trim(),
      role: form.role.trim() || null,
      bio: form.bio.trim() || null,
      commission_percentage: parseFloat(form.commission_percentage) || 0,
      is_active: form.is_active,
    };
    startTransition(async () => {
      if (editing) {
        const { error: e } = await supabase.from("team_members").update(payload).eq("id", editing.id);
        if (e) { setError(e.message); return; }
      } else {
        const { error: e } = await supabase.from("team_members").insert({ ...payload, venue_id: venueId, display_order: 0 });
        if (e) { setError(e.message); return; }
      }
      onSaved();
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
          <h2 className="text-base font-bold text-text-primary">
            {editing ? "Editar membro" : "Novo membro"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Nome *</label>
            <input
              autoFocus
              type="text"
              value={form.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              placeholder="Maria dos Santos"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Cargo / especialidade</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="Cabeleireira, Massagista…"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={2}
              placeholder="Breve descrição para o app do cliente…"
              className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Comissão (%) padrão
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.commission_percentage}
                onChange={(e) => update("commission_percentage", e.target.value)}
                className="w-full rounded-xl border border-border-default bg-surface-1 px-4 py-2.5 pr-10 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border-default bg-surface-1 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Ativo</p>
              <p className="text-xs text-text-tertiary">Aparece na agenda e no app</p>
            </div>
            <button
              type="button"
              onClick={() => update("is_active", !form.is_active)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                form.is_active ? "bg-brand-600" : "bg-surface-3",
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                form.is_active ? "translate-x-5" : "translate-x-0.5",
              )} />
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border-subtle flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border-default py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!form.display_name.trim() || pending}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
              form.display_name.trim() && !pending
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

// ─── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
  member,
  todayCount,
  onEdit,
  onDelete,
}: {
  member: TeamMemberFull;
  todayCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={cn(
      "rounded-2xl border bg-surface-0 p-5 hover:border-border-default hover:shadow-sm transition-all",
      member.is_active ? "border-border-subtle" : "border-border-subtle opacity-60",
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold",
            memberGradient(member.display_name),
          )}>
            {initials(member.display_name)}
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">{member.display_name}</p>
            {member.role && <p className="text-xs text-text-tertiary">{member.role}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
            <Pencil className="h-3.5 w-3.5 text-text-tertiary" />
          </button>
          <button onClick={() => setConfirmDelete(true)} className="rounded-lg p-1.5 hover:bg-red-50 transition-colors">
            <Trash2 className="h-3.5 w-3.5 text-text-tertiary hover:text-red-500" />
          </button>
        </div>
      </div>

      {member.bio && (
        <p className="text-xs text-text-tertiary mb-4 line-clamp-2">{member.bio}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold tabular-nums">{todayCount}</span> hoje
        </div>
        {member.commission_percentage > 0 && (
          <div className="text-xs text-text-secondary">
            {member.commission_percentage}% comissão
          </div>
        )}
        <span className={cn(
          "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold",
          member.is_active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-surface-3 text-text-tertiary",
        )}>
          {member.is_active ? "Ativo" : "Inativo"}
        </span>
      </div>

      {confirmDelete && (
        <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-3">
          <p className="flex-1 text-xs text-text-secondary">Excluir este membro?</p>
          <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-tertiary">Cancelar</button>
          <button
            onClick={() => { setConfirmDelete(false); onDelete(); }}
            className="rounded-lg bg-red-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-red-700 transition-all"
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function EquipeClient({
  venueId,
  members: initial,
  todayCounts,
  stats,
}: {
  venueId: string;
  members: TeamMemberFull[];
  todayCounts: Record<string, number>;
  stats: { activeCount: number; totalTodayApts: number };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberFull | null>(null);
  const [deleting, startDelete] = useTransition();

  function onSaved() {
    setShowModal(false);
    setEditingMember(null);
    router.refresh();
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      await supabase.from("team_members").delete().eq("id", id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Equipe</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {initial.length} membro{initial.length !== 1 ? "s" : ""} cadastrado{initial.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditingMember(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Adicionar membro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Membros ativos",    value: stats.activeCount.toString() },
          { label: "Agendamentos hoje", value: stats.totalTodayApts.toString() },
          { label: "Total na equipe",   value: initial.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border-subtle bg-surface-0 p-4 hover:border-border-default transition-all">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">{label}</p>
            <p className="mt-2 text-2xl font-mono font-bold text-text-primary tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Member grid */}
      {initial.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-default py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
            <UserCog className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-text-primary">Nenhum membro na equipe</p>
          <p className="mt-1 text-sm text-text-tertiary max-w-xs">
            Adicione profissionais para gerenciar agendamentos e comissões.
          </p>
          <button
            onClick={() => { setEditingMember(null); setShowModal(true); }}
            className="mt-5 flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Adicionar primeiro membro
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initial.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              todayCount={todayCounts[m.id] ?? 0}
              onEdit={() => { setEditingMember(m); setShowModal(true); }}
              onDelete={() => handleDelete(m.id)}
            />
          ))}
        </div>
      )}

      {(showModal || editingMember) && (
        <MemberModal
          venueId={venueId}
          editing={editingMember}
          onClose={() => { setShowModal(false); setEditingMember(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
