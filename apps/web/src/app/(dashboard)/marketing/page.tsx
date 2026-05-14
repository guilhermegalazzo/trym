import { createClient } from "@/lib/supabase/server";
import { MarketingClient } from "./marketing-client";

export type NotifPrefs = {
  reminder_24h: boolean;
  reminder_1h: boolean;
  confirmation: boolean;
  review_request: boolean;
};

export type InactiveCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  last_visit_at: string | null;
  visit_count: number;
  total_spent_cents: number;
};

export type RetentionStats = {
  total: number;
  returning: number;
  inactive30d: number;
  avgVisits: number;
};

export default async function MarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: venue } = await supabase
    .from("venues")
    .select("id, whatsapp_business_enabled, notification_prefs")
    .eq("owner_id", user.id)
    .maybeSingle();

  const defaultPrefs: NotifPrefs = {
    reminder_24h: true,
    reminder_1h: true,
    confirmation: true,
    review_request: false,
  };

  const notifPrefs: NotifPrefs = venue?.notification_prefs
    ? { ...defaultPrefs, ...(venue.notification_prefs as Partial<NotifPrefs>) }
    : defaultPrefs;

  let retention: RetentionStats = { total: 0, returning: 0, inactive30d: 0, avgVisits: 0 };
  let inactiveCustomers: InactiveCustomer[] = [];

  if (venue) {
    const cutoff30d = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);

    const { data: customers } = await supabase
      .from("venue_customers")
      .select("id, full_name, phone, last_visit_at, visit_count, total_spent_cents")
      .eq("venue_id", venue.id)
      .order("last_visit_at", { ascending: true, nullsFirst: true });

    const all = customers ?? [];
    const total = all.length;
    const returning = all.filter(c => (c.visit_count ?? 0) > 1).length;
    const inactive30d = all.filter(c => {
      if (!c.last_visit_at) return true;
      return new Date(c.last_visit_at) < cutoff30d;
    }).length;
    const avgVisits = total > 0
      ? Math.round((all.reduce((s, c) => s + (c.visit_count ?? 0), 0) / total) * 10) / 10
      : 0;

    retention = { total, returning, inactive30d, avgVisits };

    inactiveCustomers = all
      .filter(c => {
        if (!c.last_visit_at) return true;
        return new Date(c.last_visit_at) < cutoff30d;
      })
      .sort((a, b) => (b.total_spent_cents ?? 0) - (a.total_spent_cents ?? 0))
      .slice(0, 20) as InactiveCustomer[];
  }

  return (
    <MarketingClient
      venueId={venue?.id ?? null}
      waEnabled={!!venue?.whatsapp_business_enabled}
      notifPrefs={notifPrefs}
      retention={retention}
      inactiveCustomers={inactiveCustomers}
    />
  );
}
