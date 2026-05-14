"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Bell, Star, Gift, MessageSquare, Lock, Smartphone,
  CheckCircle2, Users, RefreshCw, UserX, TrendingUp, Phone, Copy, Check,
} from "lucide-react";
import type { NotifPrefs, RetentionStats, InactiveCustomer } from "./page";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-brand-600" : "bg-neutral-200",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0.5",
      )} />
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">{label}</span>
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-3xl font-mono font-bold text-text-primary tabular-nums">{value}</p>
      {sub && <p className="text-xs text-text-tertiary mt-1">{sub}</p>}
    </div>
  );
}

// ─── Notif items ──────────────────────────────────────────────────────────────

const NOTIF_ITEMS: Array<{
  key: keyof NotifPrefs; icon: React.ElementType; label: string; description: string; pro: boolean;
}> = [
  { key: "confirmation",  icon: CheckCircle2, label: "Confirmação de agendamento",  description: "Mensagem ao cliente assim que o agendamento é criado.", pro: false },
  { key: "reminder_24h", icon: Bell,         label: "Lembrete 24h antes",          description: "Lembra automaticamente 24 horas antes do horário.", pro: false },
  { key: "reminder_1h",  icon: Bell,         label: "Lembrete 1h antes",           description: "Lembrete de última hora 1 hora antes.", pro: false },
  { key: "review_request", icon: Star,       label: "Solicitação de avaliação",    description: "Pede avaliação após atendimentos concluídos.", pro: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(cents / 100);
}

function daysAgo(iso: string | null) {
  if (!iso) return "Nunca visitou";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Hoje";
  if (days === 1) return "1 dia atrás";
  return `${days} dias atrás`;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  venueId: string | null;
  waEnabled: boolean;
  notifPrefs: NotifPrefs;
  retention: RetentionStats;
  inactiveCustomers: InactiveCustomer[];
}

export function MarketingClient({ venueId, waEnabled, notifPrefs: initialPrefs, retention, inactiveCustomers }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [prefs, setPrefs]     = useState<NotifPrefs>(initialPrefs);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition]   = useTransition();

  async function handleToggle(key: keyof NotifPrefs, value: boolean) {
    if (!venueId) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    await supabase.from("venues").update({ notification_prefs: next }).eq("id", venueId);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    startTransition(() => router.refresh());
  }

  function copyPhone(id: string, phone: string) {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const retentionRate = retention.total > 0
    ? Math.round((retention.returning / retention.total) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl">

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Marketing</h1>
        <p className="mt-1 text-sm text-text-secondary">Fidelize clientes e aumente seus agendamentos.</p>
      </div>

      {/* Retention stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users}      label="Total clientes" value={retention.total}     sub="cadastrados"          color="bg-brand-50 text-brand-600" />
        <StatCard icon={RefreshCw}  label="Retorno"        value={`${retentionRate}%`} sub="visitaram 2x ou mais" color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={UserX}      label="Inativos 30d"   value={retention.inactive30d} sub="sem visita recente" color="bg-amber-50 text-amber-600" />
        <StatCard icon={TrendingUp} label="Média visitas"  value={retention.avgVisits} sub="por cliente"          color="bg-coral-50 text-coral-500" />
      </div>

      {/* WhatsApp banner */}
      {!waEnabled && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Smartphone className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">WhatsApp Business não ativo</p>
            <p className="text-xs text-amber-600 mt-0.5">
              As notificações automáticas requerem WhatsApp Business. Ative em{" "}
              <Link href="/configuracoes" className="underline font-medium">Configurações → Plano</Link>.
            </p>
          </div>
        </div>
      )}

      {/* Notification toggles */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Notificações automáticas</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Mensagens enviadas automaticamente via WhatsApp.</p>
          </div>
          {saving  && <span className="text-[11px] text-text-tertiary animate-pulse">Salvando…</span>}
          {success && <span className="text-[11px] text-emerald-600 font-medium">Salvo!</span>}
        </div>
        <div className="space-y-3">
          {NOTIF_ITEMS.map(({ key, icon: Icon, label, description, pro }) => (
            <div key={key} className="flex items-center gap-4 rounded-xl border border-border-subtle p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
                <Icon className="h-4 w-4 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  {pro && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-semibold text-coral-600">
                      <Lock className="h-2.5 w-2.5" />PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
              </div>
              <Toggle
                checked={prefs[key]}
                onChange={v => handleToggle(key, v)}
                disabled={!waEnabled || (pro && !waEnabled)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Inactive customers — win-back list */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Clientes para reativar</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Sem visita nos últimos 30 dias — ordenados por valor.</p>
          </div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2.5 py-1">
            {retention.inactive30d} clientes
          </span>
        </div>

        {inactiveCustomers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-text-tertiary">Nenhum cliente inativo. Continue assim!</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {inactiveCustomers.map(c => (
              <li key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-1 transition-colors">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-neutral-600">{initials(c.full_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{c.full_name}</p>
                  <p className="text-xs text-text-tertiary">{daysAgo(c.last_visit_at)} · {c.visit_count} visita{c.visit_count !== 1 ? "s" : ""} · {fmt(c.total_spent_cents)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.phone && (
                    <button
                      onClick={() => copyPhone(c.id, c.phone!)}
                      title="Copiar telefone"
                      className="flex items-center gap-1.5 rounded-lg border border-border-default px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      {copiedId === c.id
                        ? <><Check className="h-3 w-3 text-emerald-500" /><span className="text-emerald-600">Copiado</span></>
                        : <><Copy className="h-3 w-3" /><span className="hidden sm:inline">{c.phone}</span><Phone className="h-3 w-3 sm:hidden" /></>
                      }
                    </button>
                  )}
                  <Link
                    href={`/clientes?id=${c.id}`}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Ver
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Campaign tools */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Ferramentas de campanha</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { icon: Gift,        title: "Programa de fidelidade", description: "Cashback, pontos ou descontos para clientes recorrentes." },
            { icon: MessageSquare, title: "Campanhas em massa",   description: "Promoções e novidades para toda a base via WhatsApp." },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="relative rounded-2xl border border-border-subtle bg-surface-0 p-5 flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
                <Icon className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-text-primary">{title}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-semibold text-coral-600">
                    <Lock className="h-2.5 w-2.5" />PRO
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{description}</p>
                <Link href="/configuracoes" className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:underline">
                  Fazer upgrade →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
