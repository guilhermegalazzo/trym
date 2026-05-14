import { createClient } from "@/lib/supabase/server";
import { PagamentosClient } from "./pagamentos-client";

export type TransactionRow = {
  id: string;
  scheduled_at: string;
  status: string;
  total_cents: number;
  payment_method: string | null;
  payment_status: string | null;
  venue_customers: { full_name: string } | null;
  appointment_items: Array<{ description: string }>;
};

export type PaymentMethodStat = {
  method: string;
  label: string;
  total_cents: number;
  count: number;
};

function methodLabel(m: string | null): string {
  const map: Record<string, string> = {
    cash: "Dinheiro", pix: "PIX", debit: "Débito",
    credit: "Crédito", on_credit: "Fiado", in_app: "App",
  };
  return m ? (map[m] ?? m) : "Não informado";
}

export default async function PagamentosPage() {
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

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthRes, pendingRes, historyRes] = await Promise.all([
    // Completed this month
    supabase
      .from("appointments")
      .select("total_cents, payment_method")
      .eq("venue_id", venue.id)
      .eq("status", "completed")
      .gte("scheduled_at", monthStart.toISOString()),

    // Pending (confirmed/in_progress)
    supabase
      .from("appointments")
      .select("total_cents")
      .eq("venue_id", venue.id)
      .in("status", ["confirmed", "in_progress"]),

    // Transaction history
    supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, total_cents, payment_method, payment_status,
        venue_customers ( full_name ),
        appointment_items ( description )
      `)
      .eq("venue_id", venue.id)
      .not("status", "eq", "cancelled")
      .order("scheduled_at", { ascending: false })
      .limit(100),
  ]);

  const monthRevenue = (monthRes.data ?? []).reduce((s, a) => s + (a.total_cents ?? 0), 0);
  const pendingTotal = (pendingRes.data ?? []).reduce((s, a) => s + (a.total_cents ?? 0), 0);

  // Payment method breakdown (from this month completed)
  const methodMap: Record<string, { total_cents: number; count: number }> = {};
  for (const apt of monthRes.data ?? []) {
    const m = apt.payment_method ?? "unknown";
    if (!methodMap[m]) methodMap[m] = { total_cents: 0, count: 0 };
    methodMap[m].total_cents += apt.total_cents ?? 0;
    methodMap[m].count += 1;
  }
  const methodStats: PaymentMethodStat[] = Object.entries(methodMap)
    .map(([method, stats]) => ({ method, label: methodLabel(method), ...stats }))
    .sort((a, b) => b.total_cents - a.total_cents);

  return (
    <PagamentosClient
      transactions={(historyRes.data ?? []) as unknown as TransactionRow[]}
      stats={{ monthRevenue, pendingTotal }}
      methodStats={methodStats}
    />
  );
}
