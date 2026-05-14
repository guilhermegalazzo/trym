import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AgendamentoDetalheClient } from "./detalhe-client";

export const metadata = { title: "Agendamento — Trym" };

export default async function AgendamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/onboarding");

  const { data: apt } = await supabase
    .from("appointments")
    .select(`
      id, scheduled_at, duration_minutes, status, total_cents,
      payment_method, payment_status, customer_notes,
      venue_customers ( id, full_name, phone, email ),
      team_members ( id, display_name, avatar_url ),
      appointment_items ( id, description, total_cents )
    `)
    .eq("id", id)
    .eq("venue_id", venue.id)
    .maybeSingle();

  if (!apt) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AgendamentoDetalheClient apt={apt as any} />;
}
