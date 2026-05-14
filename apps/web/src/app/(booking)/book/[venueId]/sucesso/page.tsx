import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { TrymLogo } from "@/components/brand/logo";

export default async function SucessoPage({
  params,
  searchParams,
}: {
  params: Promise<{ venueId: string }>;
  searchParams: Promise<{ apt?: string; pending?: string }>;
}) {
  const { venueId } = await params;
  const { pending } = await searchParams;
  const isPending = pending === "1";

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="inline-block mb-2">
          <TrymLogo className="h-8 mx-auto" />
        </Link>

        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-8 space-y-4">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${isPending ? "bg-amber-50" : "bg-emerald-50"}`}>
            {isPending
              ? <Clock className="h-8 w-8 text-amber-500" />
              : <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            }
          </div>

          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {isPending ? "Pagamento em processamento" : "Agendamento confirmado!"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {isPending
                ? "Seu pagamento está sendo processado. Você receberá uma confirmação em breve."
                : "Seu agendamento foi pago e confirmado com sucesso. Até logo!"
              }
            </p>
          </div>

          <Link
            href={`/book/${venueId}`}
            className="block w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Fazer outro agendamento
          </Link>
        </div>
      </div>
    </div>
  );
}
