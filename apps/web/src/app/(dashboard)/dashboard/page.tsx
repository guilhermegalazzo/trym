import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CalendarCheck2, DollarSign, Clock, ArrowRight, Plus } from "lucide-react";
import { BookingLinkButton } from "./booking-link-button";

function getGreeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const glassCard = {
  background: "#ffffff",
  border: "1px solid #EBEBEB",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  borderRadius: "16px",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Profissional";

  const greeting  = getGreeting(new Date().getHours());
  const dateLabel = formatDate();

  const { data: venue } = user
    ? await supabase.from("venues").select("id, name").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let todayCount = 0;
  let weekRevenueCents = 0;
  let next24hCount = 0;
  let upcomingAppointments: Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    total_cents: number;
    venue_customers: { full_name: string } | null;
    team_members: { display_name: string } | null;
    appointment_items: Array<{ description: string }>;
  }> = [];

  if (venue) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const next24h    = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const weekStart  = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);

    const [todayRes, weekRes, next24hRes, upcomingRes] = await Promise.all([
      supabase.from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venue.id)
        .gte("scheduled_at", todayStart.toISOString())
        .lte("scheduled_at", todayEnd.toISOString())
        .neq("status", "cancelled"),

      supabase.from("appointments")
        .select("total_cents")
        .eq("venue_id", venue.id)
        .eq("status", "completed")
        .gte("scheduled_at", weekStart.toISOString()),

      supabase.from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("venue_id", venue.id)
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", next24h.toISOString())
        .in("status", ["confirmed", "in_progress"]),

      supabase.from("appointments")
        .select(`
          id, scheduled_at, duration_minutes, status, total_cents,
          venue_customers ( full_name ),
          team_members ( display_name ),
          appointment_items ( description )
        `)
        .eq("venue_id", venue.id)
        .gte("scheduled_at", now.toISOString())
        .in("status", ["confirmed", "in_progress"])
        .order("scheduled_at", { ascending: true })
        .limit(5),
    ]);

    todayCount          = todayRes.count ?? 0;
    weekRevenueCents    = (weekRes.data ?? []).reduce((s, a) => s + (a.total_cents ?? 0), 0);
    next24hCount        = next24hRes.count ?? 0;
    upcomingAppointments = (upcomingRes.data ?? []) as unknown as typeof upcomingAppointments;
  }

  const hasData = todayCount > 0 || next24hCount > 0 || weekRevenueCents > 0;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
              VISÃO GERAL
            </span>
            <span className="text-[11px] text-text-tertiary font-mono">
              · {dateLabel}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary" style={{ letterSpacing: "-0.03em" }}>
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Aqui está o resumo do seu negócio hoje.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {venue && <BookingLinkButton venueId={venue.id} />}
          <Link
            href="/agendamentos/novo"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-ink transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              boxShadow: "none",
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Novo agendamento
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Today's appointments — wide */}
        <div
          className="sm:col-span-2 p-6 transition-all duration-300 cursor-default"
          style={{
            ...glassCard,
            transition: "box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="flex items-start justify-between mb-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
              AGENDAMENTOS HOJE
            </span>
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(127,209,193,0.15)" }}
            >
              <CalendarCheck2 className="h-4 w-4 text-brand-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-5xl font-mono font-bold text-text-primary tabular-nums leading-none mb-3">
            {todayCount}
          </div>
          <p className="text-xs text-text-tertiary mb-4">
            {todayCount === 0
              ? "Nenhum agendamento para hoje"
              : todayCount === 1
              ? "1 agendamento confirmado"
              : `${todayCount} agendamentos confirmados`}
          </p>
          <Link
            href="/agendamentos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline transition-colors"
          >
            Ver todos
            <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>

        {/* Revenue */}
        <div className="p-5 transition-all duration-300" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
              FATURAMENTO
            </span>
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(232,90,54,0.10)" }}
            >
              <DollarSign className="h-3.5 w-3.5 text-coral-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-text-primary tabular-nums leading-none mb-1">
            {formatCurrency(weekRevenueCents)}
          </div>
          <p className="text-xs text-text-tertiary">Esta semana</p>
        </div>

        {/* Upcoming */}
        <div className="p-5 transition-all duration-300" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
              PRÓXIMAS
            </span>
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(127,209,193,0.15)" }}
            >
              <Clock className="h-3.5 w-3.5 text-brand-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-text-primary tabular-nums leading-none mb-1">
            {next24hCount}
          </div>
          <p className="text-xs text-text-tertiary">Próximas 24h</p>
        </div>

      </div>

      {/* Upcoming appointments list */}
      {upcomingAppointments.length > 0 ? (
        <div
          className="overflow-hidden"
          style={glassCard}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid #F0F0F0" }}
          >
            <h2 className="text-sm font-semibold text-text-primary">Próximos agendamentos</h2>
            <Link href="/agendamentos" className="text-xs font-medium text-brand-600 hover:underline transition-colors">
              Ver todos
            </Link>
          </div>
          <ul>
            {upcomingAppointments.map((apt, i) => {
              const scheduledAt = new Date(apt.scheduled_at);
              const timeLabel   = scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const dateLabel2  = scheduledAt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
              const serviceName = apt.appointment_items[0]?.description ?? "Serviço";
              return (
                <li
                  key={apt.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-brand-50/30 transition-colors"
                  style={i > 0 ? { borderTop: "1px solid #F5F5F5" } : undefined}
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-xs font-mono font-bold text-brand-600">{timeLabel}</div>
                    <div className="text-[10px] text-text-tertiary">{dateLabel2}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {apt.venue_customers?.full_name ?? "Cliente"}
                    </div>
                    <div className="text-xs text-text-tertiary truncate">
                      {serviceName}{apt.team_members && ` · ${apt.team_members.display_name}`}
                    </div>
                  </div>
                  <div className="text-sm font-mono font-medium text-text-secondary tabular-nums">
                    {formatCurrency(apt.total_cents)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : hasData ? (
        <div
          className="px-6 py-5 flex items-center justify-between gap-4"
          style={glassCard}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(127,209,193,0.15)" }}
            >
              <CalendarCheck2 className="h-4 w-4 text-brand-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Nenhum agendamento futuro</p>
              <p className="text-xs text-text-tertiary mt-0.5">Compartilhe seu link para receber novos agendamentos.</p>
            </div>
          </div>
          <Link
            href="/agendamentos"
            className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:underline transition-colors"
          >
            Ver histórico →
          </Link>
        </div>
      ) : (
        <div
          className="p-8 flex flex-col items-center text-center"
          style={{
            ...glassCard,
            border: "2px dashed rgba(127,209,193,0.25)",
          }}
        >
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(127,209,193,0.15)" }}
          >
            <CalendarCheck2 className="h-6 w-6 text-brand-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">Seu painel está pronto</h3>
          <p className="text-sm text-text-tertiary max-w-xs mb-5">
            Adicione serviços e compartilhe seu link — os agendamentos aparecem aqui em tempo real.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/servicos"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-ink transition-all hover:brightness-105"
              style={{ background: "var(--accent)", boxShadow: "0 4px 12px rgba(127,209,193,0.35)" }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Adicionar serviços
            </Link>
            <Link
              href="/configuracoes"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-brand-50/40"
              style={{
                background: "#F5F5F5",
                border: "1px solid #E8E8E8",
              }}
            >
              Configurações
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
