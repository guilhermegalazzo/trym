"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  icon: React.ElementType;
  label: string;
  center?: boolean;
  scroll?: boolean;
};

const TABS: Tab[] = [
  { href: "/",        icon: Home,   label: "Início" },
  { href: "#search",  icon: Search, label: "Buscar", scroll: true },
  { href: "/signup",  icon: Plus,   label: "Cadastrar", center: true },
  { href: "/login",   icon: Heart,  label: "Favoritos" },
  { href: "/login",   icon: User,   label: "Entrar" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  function handleScroll(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("search-bar")?.scrollIntoView({ behavior: "smooth", block: "center" });
    (document.getElementById("search-input") as HTMLInputElement | null)?.focus();
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "#ffffff",
        borderTop: "1px solid #EBEBEB",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-1 pb-2">
        {TABS.map(({ href, icon: Icon, label, center, scroll: doScroll }) => {
          const isHome = pathname === "/" && href === "/";
          if (center) {
            return (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-0 -mt-5"
              >
                <div
                  className="flex h-13 w-13 items-center justify-center rounded-full shadow-lg"
                  style={{
                    background: "var(--accent)",
                    width: 52,
                    height: 52,
                    boxShadow: "0 4px 14px rgba(127,209,193,0.50)",
                  }}
                >
                  <Icon className="h-6 w-6 text-ink" strokeWidth={2.5} />
                </div>
                <span className="mt-1 text-[9px] font-medium text-text-tertiary">{label}</span>
              </Link>
            );
          }

          if (doScroll) {
            return (
              <button
                key={label}
                onClick={handleScroll}
                className="flex flex-col items-center gap-0.5 px-3 py-1"
              >
                <Icon className={cn("h-5 w-5", isHome ? "text-brand-600" : "text-text-tertiary")} strokeWidth={1.8} />
                <span className={cn("text-[10px] font-medium", isHome ? "text-brand-600" : "text-text-tertiary")}>{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <Icon className={cn("h-5 w-5", isHome && href === "/" ? "text-brand-600" : "text-text-tertiary")} strokeWidth={1.8} />
              <span className={cn("text-[10px] font-medium", isHome && href === "/" ? "text-brand-600" : "text-text-tertiary")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
