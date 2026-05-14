import { createClient } from "@/lib/supabase/server";
import { MensagensClient } from "./mensagens-client";

export type ConversationCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  last_visit_at: string | null;
  private_notes: string | null;
  visit_count: number;
  total_spent_cents: number;
};

export type WaMessage = {
  id: string;
  venue_customer_id: string;
  direction: string;
  body: string | null;
  status: string | null;
  created_at: string;
};

export type AptEvent = {
  id: string;
  venue_customer_id: string;
  scheduled_at: string;
  status: string;
  total_cents: number;
  appointment_items: Array<{ description: string }>;
};

export default async function MensagensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: venue } = await supabase
    .from("venues")
    .select("id, whatsapp_business_enabled")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) {
    return (
      <div className="rounded-2xl border border-dashed border-border-default bg-surface-0 p-12 flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">Configure seu estabelecimento primeiro</p>
      </div>
    );
  }

  const [customersRes, messagesRes, aptsRes] = await Promise.all([
    supabase
      .from("venue_customers")
      .select("id, full_name, phone, last_visit_at, private_notes, visit_count, total_spent_cents")
      .eq("venue_id", venue.id)
      .order("last_visit_at", { ascending: false, nullsFirst: false })
      .limit(100),

    supabase
      .from("whatsapp_messages")
      .select("id, venue_customer_id, direction, body, status, created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(500),

    supabase
      .from("appointments")
      .select(`
        id, venue_customer_id, scheduled_at, status, total_cents,
        appointment_items ( description )
      `)
      .eq("venue_id", venue.id)
      .order("scheduled_at", { ascending: false })
      .limit(500),
  ]);

  return (
    <MensagensClient
      venueId={venue.id}
      waEnabled={!!venue.whatsapp_business_enabled}
      customers={(customersRes.data ?? []) as ConversationCustomer[]}
      messages={(messagesRes.data ?? []) as WaMessage[]}
      appointments={(aptsRes.data ?? []) as unknown as AptEvent[]}
    />
  );
}
