import type { ReactNode } from "react";
import Link from "next/link";
import { TrymLogo } from "@/components/brand/logo";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-1)" }}>
      {/* Glass navbar */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.50)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/">
            <TrymLogo iconSize={28} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-ink transition-all duration-200 hover:brightness-105 active:scale-95"
              style={{
                background: "var(--accent)",
                boxShadow: "0 4px 12px rgba(127,209,193,0.35)",
              }}
            >
              Cadastre seu negócio
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer
        className="mt-16 py-8 text-center"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <p className="text-xs text-text-tertiary">
          © {new Date().getFullYear()} Trym · Marketplace de serviços de beleza, pet e fitness no Brasil
        </p>
      </footer>
    </div>
  );
}
