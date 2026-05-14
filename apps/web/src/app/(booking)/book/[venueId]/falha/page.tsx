import Link from "next/link";
import { XCircle } from "lucide-react";
import { TrymLogo } from "@/components/brand/logo";

export default async function FalhaPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="inline-block mb-2">
          <TrymLogo className="h-8 mx-auto" />
        </Link>

        <div className="rounded-2xl border border-border-subtle bg-surface-0 p-8 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-text-primary">Pagamento não concluído</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Ocorreu um problema com seu pagamento. Seu agendamento foi salvo — tente pagar novamente ou escolha outro método.
            </p>
          </div>

          <Link
            href={`/book/${venueId}`}
            className="block w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Tentar novamente
          </Link>
        </div>
      </div>
    </div>
  );
}
