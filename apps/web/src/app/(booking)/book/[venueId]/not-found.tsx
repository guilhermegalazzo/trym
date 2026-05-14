import Link from "next/link";
import { MapPin } from "lucide-react";

export default function VenueNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-100 mb-6">
        <MapPin className="h-10 w-10 text-neutral-400" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Estabelecimento não encontrado
      </h1>
      <p className="text-sm text-text-secondary max-w-xs mb-8">
        Este link pode estar desatualizado ou o estabelecimento pode ter sido removido da plataforma.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
      >
        Ver outros estabelecimentos
      </Link>
    </div>
  );
}
