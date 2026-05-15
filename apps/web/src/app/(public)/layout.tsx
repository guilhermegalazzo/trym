import type { ReactNode } from "react";
import Link from "next/link";
import { TrymLogo } from "@/components/brand/logo";
import { BottomTabBar } from "./bottom-tab-bar";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-1)" }}>

      {/* Navbar — desktop: logo + auth links / mobile: logo only */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "#ffffff", borderBottom: "1px solid #EBEBEB" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/">
            <TrymLogo iconSize={28} />
          </Link>

          {/* Desktop auth links */}
          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile: compact login link */}
          <Link
            href="/login"
            className="md:hidden text-sm font-semibold text-brand-600"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Main content — add bottom padding on mobile for tab bar */}
      <main className="pb-20 md:pb-0">{children}</main>

      {/* Footer — desktop only */}
      <footer
        className="hidden md:block mt-16 py-8 text-center"
        style={{ borderTop: "1px solid #EBEBEB", background: "#FAFAFA" }}
      >
        <p className="text-xs text-text-tertiary">
          © {new Date().getFullYear()} Trym · Marketplace de serviços de beleza, pet e fitness no Brasil
        </p>
      </footer>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
