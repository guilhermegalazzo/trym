"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Bell, Star, Gift, MessageSquare, Megaphone, Lock, Smartphone, CheckCircle2 } from "lucide-react";
import type { NotifPrefs } from "./page";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
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
        disabled && "opacity-40 cursor-not-allowed",
        !disabled && "cursor-pointer",
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0.5",
      )} />
    </button>
  );
}

// ─── Notification items ───────────────────────────────────────────────────────

const NOTIF_ITEMS: Array<{
  key: keyof NotifPrefs;
  icon: React.ElementType;
  label: string;
  description: string;
  pro: boolean;
}> = [
  {
    key: "confirmation",
    icon: CheckCircle2,
    label: "Confirmação de agendamento",
    description: "Envia uma mensagem ao cliente assim que o agendamento é criado.",
    pro: false,
  },
  {
    key: "reminder_24h",
    icon: Bell,
    label: "Lembrete 24h antes",
    description: "Lembra o cliente automaticamente 24 horas antes do horário marcado.",
    pro: false,
  },
  {
    key: "reminder_1h",
    icon: Bell,
    label: "Lembrete 1h antes",
    description: "Lembrete de última hora 1 hora antes do agendamento.",
    pro: false,
  },
  {
    key: "review_request",
    icon: Star,
    label: "Solicitação de avaliação",
    description: "Pede avaliação automaticamente após atendimentos concluídos.",
    pro: true,
  },
];

// ─── Campaign cards ───────────────────────────────────────────────────────────

const CAMPAIGNS = [
  {
    icon: Gift,
    title: "Programa de fidelidade",
    description: "Crie cashback, pontos ou descontos para clientes recorrentes.",
    pro: true,
  },
  {
    icon: MessageSquare,
    title: "Campanhas em massa",
    description: "Envie promoções e novidades para toda sua base de clientes via WhatsApp.",
    pro: true,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  venueId: string | null;
  waEnabled: boolean;
  notifPrefs: NotifPrefs;
}

export function MarketingClient({ venueId, waEnabled, notifPrefs: initialPrefs }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [prefs, setPrefs]     = useState<NotifPrefs>(initialPrefs);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-display">Marketing</h1>
        <p className="mt-1 text-sm text-text-secondary">Fidelize clientes e aumente seus agendamentos.</p>
      </div>

      {/* WhatsApp status banner */}
      {!waEnabled && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Smartphone className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">WhatsApp Business não ativo</p>
            <p className="text-xs text-amber-600 mt-0.5">
              As notificações automáticas requerem WhatsApp Business. Ative em{" "}
              <a href="/configuracoes" className="underline font-medium">Configurações → Plano</a>.
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="rounded-2xl bg-white shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Notificações automáticas</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Mensagens enviadas automaticamente para seus clientes.</p>
          </div>
          {saving && <span className="text-[11px] text-text-tertiary animate-pulse">Salvando…</span>}
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

      {/* Campaign tools */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Ferramentas de campanha</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CAMPAIGNS.map(({ icon: Icon, title, description, pro }) => (
            <div key={title} className="relative rounded-xl bg-white shadow-card p-5 flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
                <Icon className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-text-primary">{title}</p>
                  {pro && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-semibold text-coral-600">
                      <Lock className="h-2.5 w-2.5" />PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary">{description}</p>
                <button className="mt-3 text-xs font-semibold text-brand-600 hover:underline">
                  Fazer upgrade →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance panel */}
      <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-5 w-5 text-brand-200" />
              <span className="text-sm font-semibold text-brand-100">Performance de Marketing</span>
            </div>
            <p className="text-2xl font-bold mb-1">Atraia mais clientes</p>
            <p className="text-sm text-brand-200 max-w-sm">
              {waEnabled
                ? "Ative as notificações automáticas para ver métricas de alcance, conversão e ROI aqui."
                : "Ative o WhatsApp Business e as notificações para desbloquear métricas de marketing."}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {["Alcance", "Conversão", "ROI"].map(m => (
            <div key={m}>
              <p className="text-xs text-brand-300 mb-1">{m}</p>
              <p className="text-lg font-bold text-white">—</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
