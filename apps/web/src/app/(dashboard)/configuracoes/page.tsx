"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Building2, Clock, CreditCard, Bell, Shield, Palette, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { id: "perfil",        label: "Perfil",          icon: User },
  { id: "negocio",       label: "Meu negócio",     icon: Building2 },
  { id: "horarios",      label: "Horários",        icon: Clock },
  { id: "pagamentos",    label: "Pagamentos",      icon: CreditCard },
  { id: "notificacoes",  label: "Notificações",    icon: Bell },
  { id: "plano",         label: "Plano",           icon: Palette },
  { id: "seguranca",     label: "Segurança",       icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

const DAYS = [
  { label: "Domingo",  key: 0 },
  { label: "Segunda",  key: 1 },
  { label: "Terça",   key: 2 },
  { label: "Quarta",  key: 3 },
  { label: "Quinta",  key: 4 },
  { label: "Sexta",   key: 5 },
  { label: "Sábado", key: 6 },
];

// ─── Perfil Tab ───────────────────────────────────────────────────────────────

function PerfilTab() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setFullName((user.user_metadata?.full_name as string) ?? "");
        setPhone((user.user_metadata?.phone as string) ?? "");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    const { error: err } = await supabase.auth.updateUser({ data: { full_name: fullName, phone } });
    setSaving(false);
    if (err) setError(err.message);
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
  }

  if (loading) return <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-neutral-100"/>)}</div>;

  const initials = fullName ? fullName.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() : email[0]?.toUpperCase() ?? "U";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-base font-semibold text-neutral-900">Dados pessoais</h2>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-brand-600">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">{fullName || "—"}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700">Nome completo</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"/>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">E-mail</label>
          <input type="email" value={email} disabled
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-400 outline-none cursor-not-allowed"/>
          <p className="text-[11px] text-neutral-400">Para alterar o e-mail, entre em contato com o suporte.</p>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Telefone / WhatsApp</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 99999-9999"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"/>
        </div>
      </div>
      {error   && <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
      {success && <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success font-medium">Perfil atualizado!</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

// ─── Negócio Tab ─────────────────────────────────────────────────────────────

function NegocioTab() {
  const supabase = createClient();
  const [venueId, setVenueId]     = useState<string | null>(null);
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [address, setAddress]     = useState("");
  const [city, setCity]           = useState("");
  const [state, setState]         = useState("");
  const [description, setDesc]    = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("venues").select("id,name,phone,address_line,city,state,description").eq("owner_id", user.id).maybeSingle();
      if (data) {
        setVenueId(data.id);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address_line ?? "");
        setCity(data.city ?? "");
        setState(data.state ?? "");
        setDesc(data.description ?? "");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setSaving(true); setError(""); setSuccess(false);
    const { error: err } = await supabase.from("venues").update({ name, phone, address_line: address, city, state, description }).eq("id", venueId);
    setSaving(false);
    if (err) setError(err.message);
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
  }

  if (loading) return <div className="space-y-4 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-10 rounded-lg bg-neutral-100"/>)}</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-base font-semibold text-neutral-900">Informações do negócio</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Nome do negócio</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Salão da Ana"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"/>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Telefone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 99999-9999"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"/>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Endereço</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700">Cidade</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="São Paulo"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"/>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700">Estado</label>
            <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="SP" maxLength={2}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"/>
          </div>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700">Descrição</label>
          <textarea rows={3} value={description} onChange={e => setDesc(e.target.value)} placeholder="Descreva seu negócio para os clientes…"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"/>
        </div>
      </div>
      {error   && <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
      {success && <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success font-medium">Negócio atualizado!</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

// ─── Horários Tab ────────────────────────────────────────────────────────────

type DayRow = { id?: string; open_time: string; close_time: string; is_closed: boolean };

function HorariosTab() {
  const supabase = createClient();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<number, DayRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: venue } = await supabase.from("venues").select("id").eq("owner_id", user.id).maybeSingle();
      if (!venue) return setLoading(false);
      setVenueId(venue.id);
      const { data: bh } = await supabase.from("business_hours").select("*").eq("venue_id", venue.id).order("day_of_week");
      const map: Record<number, DayRow> = {};
      (bh ?? []).forEach((r: { day_of_week: number; id: string; open_time: string | null; close_time: string | null; is_closed: boolean }) => {
        map[r.day_of_week] = { id: r.id, open_time: r.open_time ?? "09:00", close_time: r.close_time ?? "18:00", is_closed: r.is_closed };
      });
      // fill missing days
      DAYS.forEach(({ key }) => { if (!map[key]) map[key] = { open_time: "09:00", close_time: "18:00", is_closed: key === 0 }; });
      setRows(map);
      setLoading(false);
    });
  }, []);

  function update(day: number, field: keyof DayRow, value: string | boolean) {
    setRows(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setSaving(true);
    const upsertRows = DAYS.map(({ key }) => ({
      venue_id: venueId,
      day_of_week: key,
      open_time:  rows[key].is_closed ? null : rows[key].open_time,
      close_time: rows[key].is_closed ? null : rows[key].close_time,
      is_closed:  rows[key].is_closed,
    }));
    await supabase.from("business_hours").upsert(upsertRows, { onConflict: "venue_id,day_of_week" });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) return <div className="space-y-3 animate-pulse">{DAYS.map(d => <div key={d.key} className="h-12 rounded-lg bg-neutral-100"/>)}</div>;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-base font-semibold text-neutral-900">Horários de funcionamento</h2>
      <div className="space-y-2">
        {DAYS.map(({ label, key }) => (
          <div key={key} className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white p-3">
            <input type="checkbox" checked={!rows[key]?.is_closed} onChange={e => update(key, "is_closed", !e.target.checked)} className="h-4 w-4 accent-brand-500 flex-shrink-0"/>
            <span className="text-sm font-medium text-neutral-700 w-16 flex-shrink-0">{label}</span>
            {!rows[key]?.is_closed ? (
              <div className="flex items-center gap-2 flex-1">
                <input type="time" value={rows[key]?.open_time ?? "09:00"} onChange={e => update(key, "open_time", e.target.value)}
                  className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 outline-none focus:border-brand-500"/>
                <span className="text-xs text-neutral-400">até</span>
                <input type="time" value={rows[key]?.close_time ?? "18:00"} onChange={e => update(key, "close_time", e.target.value)}
                  className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 outline-none focus:border-brand-500"/>
              </div>
            ) : (
              <span className="text-xs text-neutral-400 flex-1">Fechado</span>
            )}
          </div>
        ))}
      </div>
      {success && <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success font-medium">Horários salvos!</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar horários"}
        </button>
      </div>
    </form>
  );
}

// ─── Plano Tab ───────────────────────────────────────────────────────────────

type Subscription = {
  status: string;
  plan: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
};

function PlanoTab() {
  const supabase = createClient();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setLoading(false);
      const { data: venue } = await supabase
        .from("venues").select("id").eq("owner_id", user.id).maybeSingle();
      if (!venue) return setLoading(false);
      const { data } = await supabase
        .from("subscriptions")
        .select("status,plan,trial_ends_at,current_period_end")
        .eq("venue_id", venue.id)
        .maybeSingle();
      setSub(data as Subscription | null);
      setLoading(false);
    });
  }, []);

  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : null;

  const statusLabel: Record<string, string> = {
    trialing: "Trial",
    active: "Ativo",
    past_due: "Pagamento pendente",
    read_only: "Somente leitura",
    cancelled: "Cancelado",
  };

  const planLabel = sub?.plan === "pro" ? "Pro" : "Basic";

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 rounded bg-neutral-100" />
      <div className="h-24 rounded-xl bg-neutral-100" />
      <div className="h-28 rounded-xl bg-neutral-100" />
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-text-primary">Seu plano atual</h2>

      {/* Current plan card */}
      <div className="rounded-xl border-2 border-brand-600 bg-brand-50 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-brand-700">
            Plano {planLabel}
            {sub?.status === "trialing" && trialDaysLeft !== null && (
              <> — <span className="font-mono">{trialDaysLeft}</span> dias de trial</>
            )}
          </span>
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            {sub ? statusLabel[sub.status] ?? sub.status : "—"}
          </span>
        </div>
        <p className="text-xs text-text-secondary">
          {sub?.plan === "pro"
            ? "Profissionais ilimitados · WhatsApp · Relatórios · Comissões"
            : "Agendamentos ilimitados · 1 profissional · Suporte por e-mail"}
        </p>
        {sub?.status === "trialing" && trialDaysLeft !== null && trialDaysLeft <= 3 && (
          <p className="mt-2 text-xs font-semibold text-coral-600">
            Seu trial termina em {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"}!
          </p>
        )}
      </div>

      {/* Pro upsell */}
      {sub?.plan !== "pro" && (
        <div className="rounded-xl border border-border-default bg-surface-0 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-text-primary">Plano Pro — R$ 59,90/mês</span>
            <span className="rounded-full bg-coral-100 px-2.5 py-0.5 text-xs font-semibold text-coral-600">
              Recomendado
            </span>
          </div>
          <ul className="text-xs text-text-secondary mb-4 space-y-1">
            <li>✓ Profissionais ilimitados</li>
            <li>✓ WhatsApp automático (lembretes, confirmações)</li>
            <li>✓ Relatórios avançados e comissões</li>
            <li>✓ Página pública no marketplace Trym</li>
          </ul>
          <a href="mailto:contato@trym.com.br?subject=Upgrade para Pro" className="inline-block rounded-xl bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-600 transition-colors">
            Fazer upgrade para Pro
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Notificações Tab ─────────────────────────────────────────────────────────

type NotifPrefs = {
  reminder_24h: boolean;
  reminder_1h: boolean;
  confirmation: boolean;
  review_request: boolean;
};

const NOTIF_ITEMS: Array<{ key: keyof NotifPrefs; label: string; description: string; pro?: boolean }> = [
  { key: "reminder_24h", label: "Lembrete 24h antes", description: "Envia mensagem automática ao cliente 24 horas antes do agendamento." },
  { key: "reminder_1h",  label: "Lembrete 1h antes",  description: "Envia lembrete de última hora 1 hora antes do horário marcado." },
  { key: "confirmation", label: "Confirmação de agendamento", description: "Notifica o cliente assim que o agendamento é criado." },
  { key: "review_request", label: "Solicitação de avaliação", description: "Pede avaliação automaticamente após atendimentos concluídos.", pro: true },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-brand-600" : "bg-neutral-200",
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
        checked ? "translate-x-5" : "translate-x-0.5",
      )} />
    </button>
  );
}

function NotificacoesTab() {
  const supabase = createClient();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotifPrefs>({
    reminder_24h: true, reminder_1h: true, confirmation: true, review_request: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setLoading(false);
      const { data: venue } = await supabase
        .from("venues")
        .select("id, notification_prefs")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (venue) {
        setVenueId(venue.id);
        if (venue.notification_prefs) {
          setPrefs(p => ({ ...p, ...(venue.notification_prefs as Partial<NotifPrefs>) }));
        }
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setSaving(true);
    await supabase.from("venues").update({ notification_prefs: prefs }).eq("id", venueId);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) return <div className="space-y-3 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-14 rounded-lg bg-neutral-100"/>)}</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Notificações automáticas</h2>
        <p className="mt-1 text-xs text-neutral-500">Configure quais mensagens são enviadas automaticamente para seus clientes.</p>
      </div>
      <div className="space-y-3">
        {NOTIF_ITEMS.map(({ key, label, description, pro }) => (
          <div key={key} className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-900">{label}</p>
                {pro && (
                  <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-semibold text-coral-600">PRO</span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            </div>
            <Toggle checked={prefs[key]} onChange={v => setPrefs(p => ({ ...p, [key]: v }))} />
          </div>
        ))}
      </div>
      {success && <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success font-medium">Preferências salvas!</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar preferências"}
        </button>
      </div>
    </form>
  );
}

// ─── Segurança Tab ────────────────────────────────────────────────────────────

function SegurancaTab() {
  const supabase = createClient();
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [saving, setSaving]               = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    if (newPassword !== confirmPassword) { setError("As senhas não coincidem."); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setNewPassword(""); setConfirm("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Alterar senha</h2>
        <p className="mt-1 text-xs text-neutral-500">Use uma senha forte com pelo menos 8 caracteres.</p>
      </div>
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Nova senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        {error   && <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
        {success && <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success font-medium">Senha alterada com sucesso!</p>}
        <button type="submit" disabled={saving}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
          {saving ? "Salvando…" : "Alterar senha"}
        </button>
      </form>

      <div className="border-t border-neutral-100 pt-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">Sessões ativas</h3>
        <p className="text-xs text-neutral-500 mb-3">Gerencie todos os dispositivos conectados à sua conta.</p>
        <button
          type="button"
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
          className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
        >
          Encerrar todas as sessões
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 font-display">Configurações</h1>
        <p className="mt-1 text-sm text-neutral-500">Gerencie seu perfil, negócio e preferências.</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex lg:flex-col gap-1 lg:w-48 flex-shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors text-left",
                activeTab === id ? "bg-brand-50 text-brand-600" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800")}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="flex-1 rounded-xl bg-white shadow-card p-6">
          {activeTab === "perfil"       && <PerfilTab />}
          {activeTab === "negocio"      && <NegocioTab />}
          {activeTab === "horarios"     && <HorariosTab />}
          {activeTab === "plano"        && <PlanoTab />}
          {activeTab === "pagamentos"   && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-3">
                <CreditCard className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-sm font-semibold text-neutral-900">Métodos de pagamento em breve</p>
              <p className="mt-1 text-xs text-neutral-500">Configure integrações de pagamento em uma próxima versão.</p>
            </div>
          )}
          {activeTab === "notificacoes" && <NotificacoesTab />}
          {activeTab === "seguranca"    && <SegurancaTab />}
        </div>
      </div>
    </div>
  );
}
