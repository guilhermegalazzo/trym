import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type AptItem = { description: string };
export type AptCustomer = { full_name: string; phone: string | null };
export type AptMember = { display_name: string } | null;

export type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  total_cents: number;
  venue_customers: AptCustomer | null;
  appointment_items: AptItem[];
  team_members: AptMember;
};

export type AppointmentFilter = "today" | "upcoming" | "completed" | "cancelled";

export function useAppointments(venueId: string | undefined, filter: AppointmentFilter) {
  return useQuery({
    queryKey: ["appointments", venueId, filter],
    enabled: !!venueId,
    staleTime: 30_000,
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

      let q = supabase
        .from("appointments")
        .select(`
          id, scheduled_at, status, total_cents,
          venue_customers ( full_name, phone ),
          appointment_items ( description ),
          team_members ( display_name )
        `)
        .eq("venue_id", venueId!);

      if (filter === "today") {
        q = q
          .gte("scheduled_at", todayStart.toISOString())
          .lte("scheduled_at", todayEnd.toISOString());
      } else if (filter === "upcoming") {
        q = q
          .gte("scheduled_at", now.toISOString())
          .in("status", ["confirmed", "in_progress"]);
      } else if (filter === "completed") {
        q = q.eq("status", "completed").gte("scheduled_at", (() => {
          const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString();
        })());
      } else if (filter === "cancelled") {
        q = q.in("status", ["cancelled", "no_show"]);
      }

      const { data, error } = await q
        .order("scheduled_at", { ascending: filter !== "completed" && filter !== "cancelled" })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as Appointment[];
    },
  });
}

export function useTodayStats(venueId: string | undefined) {
  return useQuery({
    queryKey: ["today-stats", venueId],
    enabled: !!venueId,
    staleTime: 30_000,
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("appointments")
        .select("status, total_cents")
        .eq("venue_id", venueId!)
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString());

      const apts = data ?? [];
      const total = apts.length;
      const completed = apts.filter(a => a.status === "completed").length;
      const revenue = apts
        .filter(a => a.status === "completed")
        .reduce((sum, a) => sum + (a.total_cents ?? 0), 0);
      const pending = apts.filter(a =>
        a.status === "confirmed" || a.status === "in_progress"
      ).length;

      return { total, completed, pending, revenue };
    },
  });
}
