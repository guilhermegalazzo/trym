"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getVenueId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("venues").select("id").eq("owner_id", user.id).maybeSingle();
  return data?.id ?? null;
}

async function ensureSystemCustomer(admin: ReturnType<typeof createAdminClient>, venueId: string): Promise<string | null> {
  const { data, error } = await admin
    .from("venue_customers")
    .upsert(
      { venue_id: venueId, full_name: "Sistema", phone: "__system__", email: null },
      { onConflict: "venue_id,phone", ignoreDuplicates: false },
    )
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

export async function createBlock(payload: {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  teamMemberId: string | null;
  reason: string;
}): Promise<{ error: string | null }> {
  const venueId = await getVenueId();
  if (!venueId) return { error: "Estabelecimento não encontrado." };

  const startMin = toMinutes(payload.startTime);
  const endMin   = toMinutes(payload.endTime);
  if (endMin <= startMin) return { error: "O horário de término deve ser após o início." };

  const admin = createAdminClient();
  const customerId = await ensureSystemCustomer(admin, venueId);
  if (!customerId) return { error: "Erro interno. Tente novamente." };

  const scheduledAt = `${payload.date}T${payload.startTime}:00`;
  const durationMinutes = endMin - startMin;

  const { error } = await admin.from("appointments").insert({
    venue_id: venueId,
    venue_customer_id: customerId,
    team_member_id: payload.teamMemberId ?? null,
    source: "block",
    status: "confirmed",
    scheduled_at: scheduledAt,
    duration_minutes: durationMinutes,
    total_cents: 0,
    internal_notes: payload.reason || null,
  });

  if (error) return { error: "Não foi possível criar o bloqueio." };
  return { error: null };
}

export async function deleteBlock(appointmentId: string): Promise<{ error: string | null }> {
  const venueId = await getVenueId();
  if (!venueId) return { error: "Estabelecimento não encontrado." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("venue_id", venueId)
    .eq("source", "block");

  if (error) return { error: "Não foi possível remover o bloqueio." };
  return { error: null };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
