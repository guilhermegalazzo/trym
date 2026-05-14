import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingClient } from "./booking-client";
import type { Metadata } from "next";

export type BookingVenue = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  address_line: string | null;
};

export type BookingService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  subcategory_id: string | null;
};

export type BookingTeamMember = {
  id: string;
  display_name: string;
  role: string | null;
  bio: string | null;
};

export type BookingHours = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueId: string }>;
}): Promise<Metadata> {
  const { venueId } = await params;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("venues")
    .select("name, description, city, state")
    .eq("id", venueId)
    .maybeSingle();

  if (!data) return { title: "Agendamento · Trym" };

  const location = [data.city, data.state].filter(Boolean).join(", ");
  const title = `${data.name} — Agendar online · Trym`;
  const description = data.description
    ?? `Agende um horário em ${data.name}${location ? ` em ${location}` : ""} diretamente pelo Trym.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, description, phone, city, state, address_line")
    .eq("id", venueId)
    .maybeSingle();

  if (!venue) notFound();

  const [servicesRes, teamRes, hoursRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, duration_minutes, price_cents, subcategory_id")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .order("display_order"),

    supabase
      .from("team_members")
      .select("id, display_name, role, bio")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .order("display_name"),

    supabase
      .from("business_hours")
      .select("day_of_week, open_time, close_time, is_closed")
      .eq("venue_id", venueId)
      .order("day_of_week"),
  ]);

  return (
    <BookingClient
      venue={venue as BookingVenue}
      services={(servicesRes.data ?? []) as BookingService[]}
      teamMembers={(teamRes.data ?? []) as BookingTeamMember[]}
      businessHours={(hoursRes.data ?? []) as BookingHours[]}
    />
  );
}
