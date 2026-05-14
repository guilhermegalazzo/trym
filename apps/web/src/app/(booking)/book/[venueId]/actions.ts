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
