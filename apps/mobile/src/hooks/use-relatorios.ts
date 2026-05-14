import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type RelatorioStats = {
  revenue: number;
  appointments: number;
  avgTicket: number;
  completionRate: number;
  newClients: number;
};

export type RelatorioService = {
  name: string;
  total_cents: number;
  count: number;
};

export type RelatorioMember = {
  name: string;
  total_cents: number;
  count: number;
  commission_percentage: number;
  commission_cents: number;
};

export type RelatorioDay = {
  date: string;
  revenue: number;
};

type RawApt = {
  id: string;
  scheduled_at: string;
  status: string;
  total_cents: number;
  team_members: { display_name: string; commission_percentage: number } | null;
  appointment_items: Array<{ description: string; total_cents: number }>;
};

export function useRelatorios(venueId: string | undefined, days: number) {
  return useQuery({
    queryKey: ["relatorios", venueId, days],
    enabled: !!venueId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - days);
      rangeStart.setHours(0, 0, 0, 0);

      const [aptsRes, customersRes] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id, scheduled_at, status, total_cents,
            team_members ( display_name, commission_percentage ),
            appointment_items ( description, total_cents )
          `)
          .eq("venue_id", venueId!)
          .gte("scheduled_at", rangeStart.toISOString()),
        supabase
          .from("venue_customers")
          .select("id")
          .eq("venue_id", venueId!)
          .gte("created_at", rangeStart.toISOString()),
      ]);

      const apts = (aptsRes.data ?? []) as unknown as RawApt[];

      const completed = apts.filter((a) => a.status === "completed");
      const revenue = completed.reduce((s, a) => s + (a.total_cents ?? 0), 0);
      const nonCancelled = apts.filter((a) => a.status !== "cancelled").length;
      const avgTicket = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
      const completionRate =
        nonCancelled > 0 ? Math.round((completed.length / nonCancelled) * 100) : 0;

      // Daily revenue array
      const dailyMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
      }
      for (const apt of completed) {
        const key = apt.scheduled_at.slice(0, 10);
        if (dailyMap[key] !== undefined) dailyMap[key] += apt.total_cents ?? 0;
      }
      const dailyRevenue: RelatorioDay[] = Object.entries(dailyMap).map(
        ([date, rev]) => ({ date, revenue: rev }),
      );

      // Top services (from appointment_items)
      const svcMap: Record<string, { total_cents: number; count: number }> = {};
      for (const apt of apts) {
        for (const item of apt.appointment_items ?? []) {
          const key = item.description ?? "Serviço";
          if (!svcMap[key]) svcMap[key] = { total_cents: 0, count: 0 };
          svcMap[key].total_cents += item.total_cents ?? 0;
          svcMap[key].count += 1;
        }
      }
      const topServices: RelatorioService[] = Object.entries(svcMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total_cents - a.total_cents)
        .slice(0, 6);

      // Member stats with commission
      const memberMap: Record<
        string,
        { total_cents: number; count: number; commission_percentage: number }
      > = {};
      for (const apt of completed) {
        const m = apt.team_members;
        if (!m) continue;
        const key = m.display_name;
        if (!memberMap[key]) {
          memberMap[key] = { total_cents: 0, count: 0, commission_percentage: m.commission_percentage ?? 0 };
        }
        memberMap[key].total_cents += apt.total_cents ?? 0;
        memberMap[key].count += 1;
      }
      const memberStats: RelatorioMember[] = Object.entries(memberMap)
        .map(([name, v]) => ({
          name,
          ...v,
          commission_cents: Math.round(v.total_cents * (v.commission_percentage / 100)),
        }))
        .sort((a, b) => b.total_cents - a.total_cents);

      return {
        stats: {
          revenue,
          appointments: apts.length,
          avgTicket,
          completionRate,
          newClients: (customersRes.data ?? []).length,
        } satisfies RelatorioStats,
        dailyRevenue,
        topServices,
        memberStats,
      };
    },
  });
}
