import { createClient } from "@/lib/supabase/server";
import { CaixaClient } from "./caixa-client";

export type CaixaSession = {
  id: string;
  opened_at: string;
  opening_amount_cents: number;
  closed_at: string | null;
  closing_amount_cents: number | null;
  expected_amount_cents: number | null;
  difference_cents: number | null;
  notes: string | null;
};

export type CaixaTransaction = {
  id: string;
  type: string;
  payment_method: string;
  amount_cents: number;
  description: string | null;
  created_at: string;
  appointments: { venue_customers: { full_name: string } | null } | null;
};

export type DailySummary = {
  cashTotal: number;
  otherTotal: number;
  salesCount: number;
  sangria: number;
  suprimento: number;
};

export default async function CaixaPage() {
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

  // Active session
  const { data: activeSession } = await supabase
    .from("cash_register_sessions")
    .select("id, opened_at, opening_amount_cents, closed_at, closing_amount_cents, expected_amount_cents, difference_cents, notes")
    .eq("venue_id", venue.id)
    .is("closed_at", null)
    .maybeSingle();

  // Today's transactions (if session open)
  let transactions: CaixaTransaction[] = [];
  let summary: DailySummary = { cashTotal: 0, otherTotal: 0, salesCount: 0, sangria: 0, suprimento: 0 };

  if (activeSession) {
    const { data: txs } = await supabase
      .from("cash_transactions")
      .select(`
        id, type, payment_method, amount_cents, description, created_at,
        appointments ( venue_customers ( full_name ) )
      `)
      .eq("session_id", activeSession.id)
      .order("created_at", { ascending: false });

    transactions = (txs ?? []) as unknown as CaixaTransaction[];

    for (const tx of transactions) {
      if (tx.type === "sale") {
        if (tx.payment_method === "cash") summary.cashTotal += tx.amount_cents;
        else summary.otherTotal += tx.amount_cents;
        summary.salesCount += 1;
      } else if (tx.type === "sangria") {
        summary.sangria += tx.amount_cents;
      } else if (tx.type === "suprimento") {
        summary.suprimento += tx.amount_cents;
      }
    }
  }

  // Session history (last 10 closed sessions)
  const { data: history } = await supabase
    .from("cash_register_sessions")
    .select("id, opened_at, opening_amount_cents, closed_at, closing_amount_cents, expected_amount_cents, difference_cents, notes")
    .eq("venue_id", venue.id)
    .not("closed_at", "is", null)
    .order("opened_at", { ascending: false })
    .limit(10);

  return (
    <CaixaClient
      venueId={venue.id}
      userId={user.id}
      activeSession={activeSession as CaixaSession | null}
      transactions={transactions}
      summary={summary}
      history={(history ?? []) as CaixaSession[]}
    />
  );
}
