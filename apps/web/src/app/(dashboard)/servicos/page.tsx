import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ServicosClient } from "./services-client";

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, category_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/onboarding");

  const [{ data: services }, { data: subcategories }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, duration_minutes, price_cents, is_active, display_order, subcategory_id")
      .eq("venue_id", venue.id)
      .order("display_order"),
    supabase
      .from("subcategories")
      .select("id, name")
      .eq("category_id", venue.category_id)
      .order("display_order"),
  ]);

  return (
    <ServicosClient
      venueId={venue.id}
      initialServices={services ?? []}
      subcategories={subcategories ?? []}
    />
  );
}
