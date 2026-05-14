"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function BookingLinkButton({ venueId }: { venueId: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/p/${venueId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar link de agendamento para clientes"
      className="flex items-center gap-1.5 rounded-xl border border-border-default bg-surface-0 px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          <span className="text-emerald-600">Copiado!</span>
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          Link de agendamento
        </>
      )}
    </button>
  );
}
