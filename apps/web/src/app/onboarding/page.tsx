"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, Scissors, PawPrint,
  Dumbbell, Sparkles, Briefcase, Clock,
} from "lucide-react";
import { TrymLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; slug: string; name: string; icon: string };
type DayHours = { open: string; close: string; isClosed: boolean };

const DAYS = [
  { label: "Dom", key: 0 },
  { label: "Seg", key: 1 },
  { label: "Ter", key: 2 },
  { label: "Qua", key: 3 },
  { label: "Qui", key: 4 },
  { label: "Sex", key: 5 },
  { label: "Sáb", key: 6 },
];

const DEFAULT_HOURS: Record<number, DayHours> = {
  0: { open: "09:00", close: "18:00", isClosed: true },
  1: { open: "09:00", close: "18:00", isClosed: false },
  2: { open: "09:00", close: "18:00", isClosed: false },
  3: { open: "09:00", close: "18:00", isClosed: false },
  4: { open: "09:00", close: "18:00", isClosed: false },
  5: { open: "09:00", close: "18:00", isClosed: false },
  6: { open: "09:00", close: "14:00", isClosed: false },
};

type CategoryConfig = {
  icon: LucideIcon;
  description: string;
  iconBg: string;
  iconColor: string;
  selectedBg: string;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  beleza: {
    icon: Scissors,
    description: "Salões, barbearias, estética",
    iconBg: "bg-brand-100",
    iconColor: "text-brand-700",
    selectedBg: "bg-brand-50",
  },
  pet: {
    icon: PawPrint,
    description: "Petshops, banho & tosa",
    iconBg: "bg-coral-100",
    iconColor: "text-coral-600",
    selectedBg: "bg-coral-50",
  },
  fitness: {
    icon: Dumbbell,
    description: "Academias, personal trainers",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    selectedBg: "bg-amber-50",
  },
};

const FALLBACK_CONFIG: CategoryConfig = {
  icon: Briefcase,
  description: "Serviços profissionais",
  iconBg: "bg-neutral-100",
  iconColor: "text-neutral-600",
  selectedBg: "bg-neutral-50",
};

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { label: "Negócio" },
  { label: "Endereço" },
  { label: "Horários" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [hours, setHours] = useState<Record<number, DayHours>>(DEFAULT_HOURS);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (data) router.replace("/dashboard");
    });

    supabase
      .from("categories")
      .select("id, slug, name, icon")
      .order("display_order")
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateHour(day: number, field: keyof DayHours, value: string | boolean) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function handleFinish() {
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);

    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .insert({ owner_id: user.id, category_id: categoryId, name, slug, phone, address_line: address, city, state })
      .select("id")
      .single();

    if (venueErr || !venue) {
      setError(venueErr?.message ?? "Erro ao criar venue.");
      setSaving(false);
      return;
    }

    const hoursRows = DAYS.map(({ key }) => ({
      venue_id: venue.id,
      day_of_week: key,
      open_time: hours[key].isClosed ? null : hours[key].open,
      close_time: hours[key].isClosed ? null : hours[key].close,
      is_closed: hours[key].isClosed,
    }));

    await supabase.from("business_hours").upsert(hoursRows, { onConflict: "venue_id,day_of_week" });
    router.push("/dashboard");
  }

  const canNext =
    step === 0 ? name.trim().length > 1 && categoryId !== "" :
    step === 1 ? city.trim().length > 0 :
    true;

  return (
    <>
      {/* Logo */}
      <div className="flex justify-center mb-10">
        <TrymLogo iconSize={44} />
      </div>

      {/* Segmented progress bar */}
      <div className="flex items-start gap-2 mb-8 px-1">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col gap-1.5">
            <motion.div
              className="h-1 rounded-full overflow-hidden bg-border-subtle"
            >
              <motion.div
                className="h-full rounded-full bg-brand-600"
                initial={{ width: "0%" }}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </motion.div>
            <span className={cn(
              "text-[11px] font-medium leading-none transition-colors duration-200",
              i <= step ? "text-brand-700" : "text-text-tertiary"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="rounded-2xl p-8 space-y-7"
          style={{
            background: "rgba(255,255,255,0.68)",
            backdropFilter: "blur(32px) saturate(200%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.70)",
            boxShadow: "0 24px 64px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* ── Step 0: Basics ── */}
          {step === 0 && (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Passo 1 de 3
                </span>
                <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary font-display">
                  Conte sobre seu negócio
                </h1>
                <p className="text-sm text-text-secondary mt-1.5">
                  Como se chama e qual é o seu nicho de atuação?
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary">
                    Nome do negócio
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Salão da Ana, Studio Pet SP"
                    className="w-full rounded-xl border border-border-default bg-surface-0 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">
                    Nicho / Categoria
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {categories.map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat.slug] ?? FALLBACK_CONFIG;
                      const Icon = cfg.icon;
                      const isSelected = categoryId === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          whileHover={{ scale: 1.01, translateY: -1 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className={cn(
                            "group relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                            isSelected
                              ? `border-brand-600 ${cfg.selectedBg} shadow-sm`
                              : "border-border-default bg-surface-0 hover:border-brand-600/40 hover:shadow-sm"
                          )}
                        >
                          <div className={cn(
                            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                            cfg.iconBg, cfg.iconColor
                          )}>
                            <Icon className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary">{cat.name}</p>
                            <p className="text-xs text-text-tertiary mt-0.5">{cfg.description}</p>
                          </div>
                          <motion.div
                            initial={false}
                            animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.5 }}
                            transition={{ duration: 0.15 }}
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-600"
                          >
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          </motion.div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 1: Address ── */}
          {step === 1 && (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Passo 2 de 3
                </span>
                <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary font-display">
                  Onde fica seu negócio?
                </h1>
                <p className="text-sm text-text-secondary mt-1.5">
                  Clientes usam isso para te encontrar.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full rounded-xl border border-border-default bg-surface-0 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary">Endereço</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="w-full rounded-xl border border-border-default bg-surface-0 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-primary">
                      Cidade <span className="text-coral-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full rounded-xl border border-border-default bg-surface-0 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-primary">Estado</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full rounded-xl border border-border-default bg-surface-0 px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 transition-all uppercase"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Hours ── */}
          {step === 2 && (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Passo 3 de 3
                </span>
                <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary font-display">
                  Horários de funcionamento
                </h1>
                <p className="text-sm text-text-secondary mt-1.5">
                  Você pode ajustar isso depois nas configurações.
                </p>
              </div>

              <div className="space-y-1.5">
                {DAYS.map(({ label, key }) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                      hours[key].isClosed
                        ? "border-border-subtle bg-surface-2/50"
                        : "border-border-default bg-surface-0"
                    )}
                  >
                    <input
                      type="checkbox"
                      id={`day-${key}`}
                      checked={!hours[key].isClosed}
                      onChange={(e) => updateHour(key, "isClosed", !e.target.checked)}
                      className="h-4 w-4 rounded accent-brand-600 flex-shrink-0"
                    />
                    <label
                      htmlFor={`day-${key}`}
                      className={cn(
                        "text-sm font-semibold w-9 flex-shrink-0 cursor-pointer select-none",
                        hours[key].isClosed ? "text-text-disabled" : "text-text-primary"
                      )}
                    >
                      {label}
                    </label>
                    {!hours[key].isClosed ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={hours[key].open}
                          onChange={(e) => updateHour(key, "open", e.target.value)}
                          className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-text-primary font-mono outline-none focus:border-brand-600 bg-surface-0"
                        />
                        <Clock className="h-3 w-3 text-text-tertiary flex-shrink-0" />
                        <input
                          type="time"
                          value={hours[key].close}
                          onChange={(e) => updateHour(key, "close", e.target.value)}
                          className="rounded-lg border border-border-default px-2.5 py-1.5 text-xs text-text-primary font-mono outline-none focus:border-brand-600 bg-surface-0"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-text-disabled flex-1 font-medium">Fechado</span>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-1">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 rounded-xl border border-border-default px-4 h-12 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:border-border-strong transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            <motion.button
              type="button"
              disabled={!canNext || saving}
              onClick={() => step < 2 ? setStep(step + 1) : handleFinish()}
              whileHover={canNext && !saving ? { scale: 1.01 } : {}}
              whileTap={canNext && !saving ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-semibold transition-all duration-200"
              style={canNext && !saving ? {
                background: "var(--accent)",
                color: "var(--ink)",
                boxShadow: "0 4px 16px rgba(127,209,193,0.40)",
              } : {
                background: "rgba(10,10,10,0.06)",
                color: "var(--ink-subtle)",
                cursor: "not-allowed",
              }}
            >
              {saving ? (
                "Criando…"
              ) : step < 2 ? (
                <>
                  Próximo
                  <motion.div
                    animate={{ x: 0 }}
                    whileHover={{ x: 3 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </>
              ) : (
                <>
                  Criar meu negócio
                  <Check className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      {step === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center text-xs text-text-tertiary flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          Você tem{" "}
          <strong className="font-semibold text-brand-700">14 dias grátis</strong>
          {" "}— sem cartão de crédito.
        </motion.p>
      )}
    </>
  );
}
