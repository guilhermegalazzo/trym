import { createClient } from "@/lib/supabase/server";
import { ClientesClient } from "./clientes-client";

export type CustomerRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  total_spent_cents: number;
  visit_count: number;
  last_visit_at: string | null;
  private_notes: string | null;
  tags: string[];
  created_at: string;
};

export default async function ClientesPage() {
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

  const { data: customers } = await supabase
    .from("venue_customers")
    .select("id, full_name, phone, email, birth_date, total_spent_cents, visit_count, last_visit_at, private_notes, tags, created_at")
    .eq("venue_id", venue.id)
    .order("last_visit_at", { ascending: false, nullsFirst: false })
    .limit(500);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = (customers ?? []) as CustomerRow[];
  const newThisMonth = rows.filter((c) => new Date(c.created_at) >= monthStart).length;
  const recurring = rows.filter((c) => c.visit_count > 1).length;

  return (
    <ClientesClient
      venueId={venue.id}
      customers={rows}
      stats={{ total: rows.length, newThisMonth, recurring }}
    />
  );
}
