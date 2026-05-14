import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { getMpClient } from "@/lib/mp";

export async function POST(req: Request) {
  const mp = getMpClient();
  if (!mp) {
    return NextResponse.json({ error: "Mercado Pago não configurado" }, { status: 503 });
  }

  const body = await req.json() as {
    appointmentId: string;
    venueId: string;
    items: Array<{ title: string; quantity: number; unit_price: number }>;
    payer: { name: string; email: string; phone?: string };
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trym.vercel.app";

  try {
    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        external_reference: body.appointmentId,
        items: body.items.map(i => ({
          id: i.title,
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unit_price,
          currency_id: "BRL" as const,
        })),
        payer: {
          name: body.payer.name.split(" ")[0],
          surname: body.payer.name.split(" ").slice(1).join(" ") || " ",
          email: body.payer.email || "cliente@trym.app",
          phone: body.payer.phone ? { number: body.payer.phone } : undefined,
        },
        back_urls: {
          success: `${baseUrl}/book/${body.venueId}/sucesso?apt=${body.appointmentId}`,
          failure: `${baseUrl}/book/${body.venueId}/falha?apt=${body.appointmentId}`,
          pending: `${baseUrl}/book/${body.venueId}/sucesso?apt=${body.appointmentId}&pending=1`,
        },
        notification_url: `${baseUrl}/api/mp/webhook`,
        statement_descriptor: "TRYM",
        expires: false,
      },
    });

    return NextResponse.json({ checkoutUrl: result.init_point });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar preferência";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
