import type { ReactNode } from "react";
import Link from "next/link";
import { TrymLogo } from "@/components/brand/logo";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-1">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/">
            <TrymLogo iconSize={28} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Cadastre seu negócio
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border-subtle bg-white mt-16 py-8 text-center">
        <p className="text-xs text-text-tertiary">
          © {new Date().getFullYear()} Trym · Marketplace de serviços de beleza, pet e fitness no Brasil
        </p>
      </footer>
    </div>
  );
}
