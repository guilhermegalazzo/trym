import { createClient } from "@/lib/supabase/server";
import { RelatoriosClient } from "./relatorios-client";

export type DailyPoint = { date: string; revenue: number; count: number };
export type ServiceStat = { name: string; total_cents: number; count: number };
export type MemberStat  = { name: string; total_cents: number; count: number; commission_percentage: number; commission_cents: number };
export type ReportStats = {
  revenue: number;
  appointments: number;
  newClients: number;
  avgTicket: number;
  noShows: number;
  completionRate: number;
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) {
    return (
      <div className="rounded-2xl border border-dashed border-border-default bg-surface-0 p-12 flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">Configure seu estabelecimento primeiro</p>
      </div>
    );
  }

  const params = await searchParams;
  const days = parseInt(params.days ?? "30", 10);
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - days);
  rangeStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [aptsRes, customersRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, total_cents,
        team_members ( display_name, commission_percentage )
      `)
      .eq("venue_id", venue.id)
      .gte("scheduled_at", rangeStart.toISOString())
      .order("scheduled_at", { ascending: true }),

    supabase
      .from("venue_customers")
      .select("created_at")
      .eq("venue_id", venue.id)
      .gte("created_at", rangeStart.toISOString()),
  ]);

  const apts = (aptsRes.data ?? []) as unknown as Array<{
    id: string;
    scheduled_at: string;
    status: string;
    total_cents: number;
    team_members: { display_name: string; commission_percentage: number } | null;
  }>;

  // Fetch items for completed appointments in the period
  const aptIds = apts.map((a) => a.id);
  const { data: itemsData } = aptIds.length > 0
    ? await supabase
        .from("appointment_items")
        .select("appointment_id, description, total_cents, service_id")
        .in("appointment_id", aptIds)
    : { data: [] };

  const items = itemsData ?? [];

  // ── Aggregate ──────────────────────────────────────────────────────────────

  const completed = apts.filter((a) => a.status === "completed");
  const revenue = completed.reduce((s, a) => s + (a.total_cents ?? 0), 0);
  const noShows = apts.filter((a) => a.status === "no_show").length;
  const nonCancelled = apts.filter((a) => a.status !== "cancelled").length;
  const avgTicket = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
  const completionRate = nonCancelled > 0 ? Math.round((completed.length / nonCancelled) * 100) : 0;

  // Daily chart data
  const dailyMap: Record<string, { revenue: number; count: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap[d.toISOString().slice(0, 10)] = { revenue: 0, count: 0 };
  }
  for (const apt of completed) {
    const key = apt.scheduled_at.slice(0, 10);
    if (dailyMap[key]) {
      dailyMap[key].revenue += apt.total_cents ?? 0;
      dailyMap[key].count += 1;
    }
  }
  const dailyData: DailyPoint[] = Object.entries(dailyMap).map(([date, v]) => ({
    date, revenue: v.revenue, count: v.count,
  }));

  // Top services
  const svcMap: Record<string, { total_cents: number; count: number }> = {};
  for (const item of items) {
    const key = item.description ?? "Serviço";
    if (!svcMap[key]) svcMap[key] = { total_cents: 0, count: 0 };
    svcMap[key].total_cents += item.total_cents ?? 0;
    svcMap[key].count += 1;
  }
  const topServices: ServiceStat[] = Object.entries(svcMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total_cents - a.total_cents)
    .slice(0, 8);

  // Top members with commission
  const memberMap: Record<string, { total_cents: number; count: number; commission_percentage: number }> = {};
  for (const apt of completed) {
    const tm = apt.team_members;
    const name = tm?.display_name ?? "Sem profissional";
    if (!memberMap[name]) memberMap[name] = { total_cents: 0, count: 0, commission_percentage: tm?.commission_percentage ?? 0 };
    memberMap[name].total_cents += apt.total_cents ?? 0;
    memberMap[name].count += 1;
  }
  const topMembers: MemberStat[] = Object.entries(memberMap)
    .map(([name, v]) => ({
      name,
      ...v,
      commission_cents: Math.round(v.total_cents * (v.commission_percentage / 100)),
    }))
    .sort((a, b) => b.total_cents - a.total_cents)
    .slice(0, 8);

  const stats: ReportStats = {
    revenue,
    appointments: apts.length,
    newClients: (customersRes.data ?? []).length,
    avgTicket,
    noShows,
    completionRate,
  };

  return (
    <RelatoriosClient
      days={days}
      stats={stats}
      dailyData={dailyData}
      topServices={topServices}
      topMembers={topMembers}
    />
  );
}
