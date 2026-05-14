import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { getMpClient } from "@/lib/mp";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.json() as { type?: string; data?: { id?: string } };

  // MP sends different event types; we only care about payment notifications
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mp = getMpClient();
  if (!mp) return NextResponse.json({ ok: true });

  try {
    const paymentApi = new Payment(mp);
    const payment = await paymentApi.get({ id: String(body.data.id) });

    const appointmentId = payment.external_reference;
    if (!appointmentId) return NextResponse.json({ ok: true });

    const supabase = createAdminClient();

    const paymentStatus = payment.status === "approved" ? "paid" : "pending";
    const paymentMethod = mapMethod(payment.payment_type_id ?? null);

    await supabase
      .from("appointments")
      .update({ payment_status: paymentStatus, payment_method: paymentMethod })
      .eq("id", appointmentId);

    return NextResponse.json({ ok: true });
  } catch {
    // Don't expose internal errors to MP
    return NextResponse.json({ ok: true });
  }
}

function mapMethod(mpType: string | null): string {
  if (!mpType) return "in_app";
  if (mpType === "credit_card") return "credit";
  if (mpType === "debit_card") return "debit";
  if (mpType === "bank_transfer") return "pix";
  if (mpType === "ticket") return "cash";
  return "in_app";
}

// MP also sends GET to verify the webhook URL is reachable
export async function GET() {
  return NextResponse.json({ ok: true });
}
