import { createClient } from "@/lib/supabase/server";
import { MarketingClient } from "./marketing-client";

export type NotifPrefs = {
  reminder_24h: boolean;
  reminder_1h: boolean;
  confirmation: boolean;
  review_request: boolean;
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

  return (
    <MarketingClient
      venueId={venue?.id ?? null}
      waEnabled={!!venue?.whatsapp_business_enabled}
      notifPrefs={notifPrefs}
    />
  );
}
