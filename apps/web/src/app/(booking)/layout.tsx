import type { ReactNode } from "react";
import { TrymLogo } from "@/components/brand/logo";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-1)" }}>
      <header
        className="px-6 py-3"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #EBEBEB",
        }}
      >
        <TrymLogo iconSize={26} />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
