import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteClient } from "./invite-client";

type Props = { params: Promise<{ venueId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueId } = await params;
  const supabase = createAdminClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("name, description, city, state, categories(name)")
    .eq("id", venueId)
    .maybeSingle();

  if (!venue) return { title: "Trym" };

  const location = [venue.city, venue.state].filter(Boolean).join(", ");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const category = ((venue.categories as any)?.name as string | undefined) ?? "Serviços";
  const title = `${venue.name} — Agende agora 📅`;
  const description = venue.description
    ?? `Reserve seu horário em ${venue.name}${location ? ` em ${location}` : ""}. Rápido, fácil e sem ligação.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Trym",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      "og:type": "business.business",
      "business:contact_data:locality": venue.city ?? "",
      "business:contact_data:country_name": "Brasil",
    },
  };
}

export default async function InvitePage({ params }: Props) {
  const { venueId } = await params;
  const supabase = createAdminClient();

  const [venueRes, servicesRes, teamRes] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, description, city, state, address_line, phone, category_id, categories(name, slug)")
      .eq("id", venueId)
      .maybeSingle(),

    supabase
      .from("services")
      .select("id, name, description, price_cents, duration_minutes")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(12),

    supabase
      .from("team_members")
      .select("id, display_name, bio, avatar_url")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .limit(8),
  ]);

  if (!venueRes.data) notFound();

  return (
    <InviteClient
      venue={venueRes.data as any}
      services={(servicesRes.data ?? []) as any}
      team={(teamRes.data ?? []) as any}
    />
  );
}
