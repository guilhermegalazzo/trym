import { createClient } from "@/lib/supabase/server";
import { CalendarioClient } from "./calendario-client";

export type CalAppointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  source: string;
  total_cents: number;
  internal_notes: string | null;
  venue_customers: { full_name: string } | null;
  team_members: { id: string; display_name: string; avatar_url: string | null } | null;
  appointment_items: Array<{ description: string }>;
};

export type CalTeamMember = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export default async function CalendarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div className="text-text-secondary text-sm">Não autenticado.</div>;

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) {
    return (
      <div className="rounded-2xl border border-dashed border-border-default bg-surface-0 p-12 flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">Nenhum estabelecimento encontrado</p>
        <p className="text-sm text-text-tertiary">Configure seu estabelecimento nas configurações.</p>
      </div>
    );
  }

  // Fetch 6 weeks of appointments for calendar navigation
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 30);
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 60);

  const [appointmentsRes, teamRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id, scheduled_at, duration_minutes, status, source, total_cents, internal_notes,
        venue_customers ( full_name ),
        team_members ( id, display_name, avatar_url ),
        appointment_items ( description )
      `)
      .eq("venue_id", venue.id)
      .gte("scheduled_at", rangeStart.toISOString())
      .lte("scheduled_at", rangeEnd.toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true }),

    supabase
      .from("team_members")
      .select("id, display_name, avatar_url")
      .eq("venue_id", venue.id)
      .eq("is_active", true)
      .order("display_name"),
  ]);

  return (
    <CalendarioClient
      appointments={(appointmentsRes.data ?? []) as unknown as CalAppointment[]}
      teamMembers={(teamRes.data ?? []) as unknown as CalTeamMember[]}
    />
  );
}
