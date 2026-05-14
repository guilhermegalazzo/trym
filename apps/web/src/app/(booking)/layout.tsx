import type { ReactNode } from "react";
import { TrymLogo } from "@/components/brand/logo";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-1)" }}>
      <header
        className="px-6 py-3"
        style={{
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.50)",
          boxShadow: "0 2px 16px rgba(10,10,10,0.04)",
        }}
      >
        <TrymLogo iconSize={26} />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
