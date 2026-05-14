import type { ReactNode } from "react";
import { TrymLogo } from "@/components/brand/logo";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-1">
      <header className="border-b border-border-subtle bg-white px-6 py-3">
        <TrymLogo iconSize={26} />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
