"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, CalendarCheck2, Users, TrendingUp, Download, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyPoint, ServiceStat, MemberStat, ReportStats } from "./page";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(cents / 100);
}

function formatCurrencyFull(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(cents / 100);
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const GRADIENT_COLORS = [
  "from-brand-400 to-brand-600", "from-coral-300 to-coral-500",
  "from-violet-400 to-violet-600", "from-amber-400 to-amber-600",
  "from-emerald-400 to-emerald-600",
];
function memberGradient(name: string) {
  return GRADIENT_COLORS[name.charCodeAt(0) % GRADIENT_COLORS.length];
}

// ─── Custom tooltip for chart ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-default bg-surface-0 shadow-lg px-3 py-2.5">
      <p className="text-[11px] text-text-tertiary mb-1">{label ? formatDateShort(label) : ""}</p>
      <p className="text-sm font-mono font-bold text-text-primary">{formatCurrencyFull(payload[0].value)}</p>
    </div>
  );
}

// ─── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, highlight = false }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-5 hover:border-border-default hover:shadow-sm transition-all",
      highlight ? "border-brand-200 bg-brand-50/50" : "border-border-subtle bg-surface-0",
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">{label}</span>
        <div className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center",
          highlight ? "bg-brand-100" : "bg-surface-2",
        )}>
          <Icon className={cn("h-3.5 w-3.5", highlight ? "text-brand-600" : "text-text-tertiary")} strokeWidth={1.5} />
        </div>
      </div>
      <p className="text-2xl font-mono font-bold text-text-primary tabular-nums">{value}</p>
      {sub && <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: 7,   label: "7 dias"  },
  { value: 30,  label: "30 dias" },
  { value: 90,  label: "90 dias" },
  { value: 365, label: "1 ano"   },
];

export function RelatoriosClient({
  days,
  stats,
  dailyData,
  topServices,
  topMembers,
}: {
  days: number;
  stats: ReportStats;
  dailyData: DailyPoint[];
  topServices: ServiceStat[];
  topMembers: MemberStat[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPeriod(d: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", d.toString());
    router.push(`?${params.toString()}`);
  }

  const maxService = topServices[0]?.total_cents ?? 1;
  const maxMember  = topMembers[0]?.total_cents ?? 1;
  const hasChartData = dailyData.some((d) => d.revenue > 0);

  // Downsample x-axis ticks for readability
  const xTickInterval = days <= 7 ? 0 : days <= 30 ? 6 : days <= 90 ? 13 : 30;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-sm text-text-secondary mt-0.5">Visão financeira e operacional</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border-default bg-surface-0 overflow-hidden">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={cn(
                  "px-3 py-2 text-xs font-semibold transition-colors",
                  days === value
                    ? "bg-brand-600 text-white"
                    : "text-text-secondary hover:bg-surface-2",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const csv = [
                "Data,Receita (R$),Agendamentos",
                ...dailyData.map((d) => `${d.date},${(d.revenue / 100).toFixed(2)},${d.count}`),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `relatorio-${days}d.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-border-default bg-surface-0 px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard icon={DollarSign}    label="Faturamento"   value={formatCurrency(stats.revenue)}      sub={`${days} dias`}                highlight />
        <KpiCard icon={CalendarCheck2} label="Agendamentos" value={stats.appointments.toString()}      sub="realizados no período"          />
        <KpiCard icon={Users}          label="Novos clientes" value={stats.newClients.toString()}      sub="cadastrados no período"         />
        <KpiCard icon={TrendingUp}     label="Ticket médio"  value={formatCurrency(stats.avgTicket)}  sub="por atendimento concluído"      />
        <KpiCard icon={CalendarCheck2} label="Conclusão"    value={`${stats.completionRate}%`}        sub="taxa de conclusão"              />
        <KpiCard icon={UserMinus}      label="No-shows"     value={stats.noShows.toString()}          sub="sem comparecer"                 />
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-text-primary">Faturamento por dia</p>
          <span className="text-xs text-text-tertiary">{days} dias</span>
        </div>
        {hasChartData ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0F766E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(15 23 42 / 0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateShort}
                interval={xTickInterval}
                tick={{ fontSize: 10, fill: "#A3A3A3" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `R$${(v / 100).toFixed(0)}`}
                tick={{ fontSize: 10, fill: "#A3A3A3" }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0F766E"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#0F766E", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-52 text-center">
            <TrendingUp className="h-10 w-10 text-text-disabled mb-3" strokeWidth={1} />
            <p className="text-sm text-text-tertiary">Dados insuficientes</p>
            <p className="text-xs text-text-tertiary mt-1">Complete atendimentos para ver o gráfico.</p>
          </div>
        )}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Top services */}
        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Serviços mais realizados</p>
          {topServices.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-text-tertiary">Sem dados no período</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {topServices.map((svc, i) => (
                <li key={svc.name} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-text-tertiary w-4 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary truncate">{svc.name}</span>
                      <span className="text-xs font-mono font-semibold text-text-primary tabular-nums ml-2 flex-shrink-0">{formatCurrency(svc.total_cents)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${(svc.total_cents / maxService) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{svc.count}x realizado</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Top team members */}
        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-text-primary">Performance da equipe</p>
            {topMembers.some((m) => m.commission_cents > 0) && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 rounded-full px-2.5 py-0.5">
                {formatCurrencyFull(topMembers.reduce((s, m) => s + m.commission_cents, 0))} em comissões
              </span>
            )}
          </div>
          {topMembers.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-text-tertiary">Sem dados no período</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {topMembers.map((m, i) => (
                <li key={m.name} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-text-tertiary w-4 tabular-nums">{i + 1}</span>
                  <div className={cn("h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0", memberGradient(m.name))}>
                    {initials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary truncate">{m.name}</span>
                      <span className="text-xs font-mono font-semibold text-text-primary tabular-nums ml-2 flex-shrink-0">{formatCurrency(m.total_cents)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-coral-400 transition-all"
                        style={{ width: `${(m.total_cents / maxMember) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] text-text-tertiary">{m.count} atendimento{m.count !== 1 ? "s" : ""}</p>
                      {m.commission_cents > 0 && (
                        <p className="text-[10px] font-semibold text-amber-600">
                          {formatCurrency(m.commission_cents)} ({m.commission_percentage}%)
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

      </div>
    </div>
  );
}
