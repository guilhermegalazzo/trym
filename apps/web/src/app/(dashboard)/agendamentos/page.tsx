import { createClient } from "@/lib/supabase/server";
import { AgendamentosClient } from "./agendamentos-client";

export type AppointmentRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  total_cents: number;
  payment_method: string | null;
  payment_status: string | null;
  customer_notes: string | null;
  venue_customers: { id: string; full_name: string; phone: string | null } | null;
  team_members: { id: string; display_name: string; avatar_url: string | null } | null;
  appointment_items: Array<{ id: string; description: string; total_cents: number }>;
};

export type ServiceRow = {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  category?: string | null;
};

export type TeamMemberRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export default async function AgendamentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="text-text-secondary text-sm">Não autenticado.</div>;
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) {
    return (
      <div className="rounded-2xl border border-dashed border-border-default bg-surface-0 p-12 flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">Nenhum estabelecimento encontrado</p>
        <p className="text-sm text-text-tertiary">Configure seu estabelecimento primeiro nas configurações.</p>
      </div>
    );
  }

  const [appointmentsRes, servicesRes, teamRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id, scheduled_at, duration_minutes, status, total_cents,
        payment_method, payment_status, customer_notes,
        venue_customers ( id, full_name, phone ),
        team_members ( id, display_name, avatar_url ),
        appointment_items ( id, description, total_cents )
      `)
      .eq("venue_id", venue.id)
      .order("scheduled_at", { ascending: false })
      .limit(200),

    supabase
      .from("services")
      .select("id, name, price_cents, duration_minutes")
      .eq("venue_id", venue.id)
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("team_members")
      .select("id, display_name, avatar_url")
      .eq("venue_id", venue.id)
      .eq("is_active", true)
      .order("display_name"),
  ]);

  return (
    <AgendamentosClient
      venueId={venue.id}
      appointments={(appointmentsRes.data ?? []) as unknown as AppointmentRow[]}
      services={(servicesRes.data ?? []) as unknown as ServiceRow[]}
      teamMembers={(teamRes.data ?? []) as unknown as TeamMemberRow[]}
    />
  );
}
