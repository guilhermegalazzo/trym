import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NovoAgendamentoClient } from "./novo-client";

export const metadata = { title: "Novo agendamento — Trym" };

export default async function NovoAgendamentoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/onboarding");

  const [servicesRes, teamRes] = await Promise.all([
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
    <NovoAgendamentoClient
      venueId={venue.id}
      services={servicesRes.data ?? []}
      teamMembers={teamRes.data ?? []}
    />
  );
}
