"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type BookingPayload = {
  venueId: string;
  teamMemberId: string | null;
  scheduledAt: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  services: Array<{ serviceId: string; description: string; priceCents: number }>;
  totalCents: number;
};

export async function submitBooking(payload: BookingPayload): Promise<{ error: string | null; appointmentId: string | null }> {
  const supabase = createAdminClient();

  // Upsert venue_customer by phone
  const { data: customer, error: customerErr } = await supabase
    .from("venue_customers")
    .upsert(
      {
        venue_id: payload.venueId,
        full_name: payload.customerName.trim(),
        phone: payload.customerPhone.trim() || null,
        email: payload.customerEmail.trim() || null,
      },
      { onConflict: "venue_id,phone", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (customerErr || !customer) {
    // Fallback: try inserting without phone as unique key
    const { data: inserted, error: insertErr } = await supabase
      .from("venue_customers")
      .insert({
        venue_id: payload.venueId,
        full_name: payload.customerName.trim(),
        phone: payload.customerPhone.trim() || null,
        email: payload.customerEmail.trim() || null,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return { error: "Não foi possível registrar seu contato. Tente novamente.", appointmentId: null };
    }

    return createAppointment(supabase, inserted.id, payload);
  }

  return createAppointment(supabase, customer.id, payload);
}

async function createAppointment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  payload: BookingPayload,
): Promise<{ error: string | null; appointmentId: string | null }> {
  // Guard against double-booking: check for overlapping appointments
  const newStart = new Date(payload.scheduledAt).getTime();
  const newEnd   = newStart + payload.durationMinutes * 60_000;

  // Fetch appointments that start up to 8h before our slot (covers long-duration overlaps)
  const lookback = new Date(newStart - 8 * 60 * 60_000).toISOString();
  const newEndISO = new Date(newEnd).toISOString();

  let conflictQuery = supabase
    .from("appointments")
    .select("scheduled_at, duration_minutes")
    .eq("venue_id", payload.venueId)
    .in("status", ["confirmed", "in_progress"])
    .gte("scheduled_at", lookback)
    .lt("scheduled_at", newEndISO);

  if (payload.teamMemberId) {
    conflictQuery = conflictQuery.eq("team_member_id", payload.teamMemberId);
  }

  const { data: existing } = await conflictQuery;

  const hasConflict = (existing ?? []).some((apt: { scheduled_at: string; duration_minutes: number }) => {
    const aptStart = new Date(apt.scheduled_at).getTime();
    const aptEnd   = aptStart + (apt.duration_minutes ?? 60) * 60_000;
    return aptStart < newEnd && aptEnd > newStart;
  });

  if (hasConflict) {
    return {
      error: "Este horário não está mais disponível. Escolha outro horário e tente novamente.",
      appointmentId: null,
    };
  }

  const { data: apt, error: aptErr } = await supabase
    .from("appointments")
    .insert({
      venue_id: payload.venueId,
      venue_customer_id: customerId,
      team_member_id: payload.teamMemberId,
      source: "marketplace",
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes,
      status: "confirmed",
      total_cents: payload.totalCents,
      payment_method: null,
      payment_status: "pending",
    })
    .select("id")
    .single();

  if (aptErr || !apt) {
    return { error: "Não foi possível criar o agendamento. Tente novamente.", appointmentId: null };
  }

  if (payload.services.length > 0) {
    await supabase.from("appointment_items").insert(
      payload.services.map((s, i) => ({
        appointment_id: apt.id,
        service_id: s.serviceId,
        description: s.description,
        quantity: 1,
        unit_price_cents: s.priceCents,
        total_cents: s.priceCents,
        display_order: i,
      }))
    );
  }

  return { error: null, appointmentId: apt.id };
}
