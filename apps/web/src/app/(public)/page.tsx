import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarketplaceClient } from "./marketplace-client";
import type { PublicVenue, PublicCategory } from "../page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trym — Agende serviços de beleza, pet e fitness",
  description:
    "Reserve em segundos em salões, petshops e academias perto de você. Sem ligação, sem espera.",
  openGraph: {
    title: "Trym — Agende serviços perto de você",
    description: "Reserve em segundos. Sem ligação, sem espera.",
    type: "website",
  },
};

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const admin = createAdminClient();
  const [venuesRes, categoriesRes] = await Promise.all([
    admin
      .from("venues")
      .select("id, name, description, city, state, address_line, phone, category_id, categories(name, slug)")
      .order("name")
      .limit(100),
    admin
      .from("categories")
      .select("id, name, slug")
      .order("display_order"),
  ]);

  return (
    <MarketplaceClient
      venues={(venuesRes.data ?? []) as unknown as PublicVenue[]}
      categories={(categoriesRes.data ?? []) as PublicCategory[]}
    />
  );
}
