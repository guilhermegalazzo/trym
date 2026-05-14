import { createClient } from "@/lib/supabase/server";
import { EquipeClient } from "./equipe-client";

export type TeamMemberFull = {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  role: string | null;
  commission_percentage: number;
  is_active: boolean;
  display_order: number;
};

export default async function EquipePage() {
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
        <p className="text-sm text-text-tertiary">Acesse Configurações para completar o cadastro.</p>
      </div>
    );
  }

  // Count today's appointments per member
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [membersRes, todayAptsRes] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, display_name, bio, avatar_url, role, commission_percentage, is_active, display_order")
      .eq("venue_id", venue.id)
      .order("display_order"),

    supabase
      .from("appointments")
      .select("team_member_id")
      .eq("venue_id", venue.id)
      .gte("scheduled_at", todayStart.toISOString())
      .lte("scheduled_at", todayEnd.toISOString())
      .neq("status", "cancelled"),
  ]);

  const members = (membersRes.data ?? []) as TeamMemberFull[];

  // Map: team_member_id → count today
  const todayCounts: Record<string, number> = {};
  for (const apt of todayAptsRes.data ?? []) {
    if (apt.team_member_id) {
      todayCounts[apt.team_member_id] = (todayCounts[apt.team_member_id] ?? 0) + 1;
    }
  }

  const activeCount = members.filter((m) => m.is_active).length;
  const totalTodayApts = Object.values(todayCounts).reduce((s, n) => s + n, 0);

  return (
    <EquipeClient
      venueId={venue.id}
      members={members}
      todayCounts={todayCounts}
      stats={{ activeCount, totalTodayApts }}
    />
  );
}
