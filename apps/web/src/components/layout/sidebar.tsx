"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrymLogo } from "@/components/brand/logo";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Users,
  Scissors,
  UserCog,
  MessageSquare,
  CreditCard,
  Megaphone,
  BarChart2,
  Settings,
  ChevronDown,
  Sparkles,
  Archive,
  Zap,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "PRINCIPAL",
    items: [
      { href: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
      { href: "/calendario",   label: "Calendário",    icon: CalendarDays },
      { href: "/agendamentos", label: "Agendamentos",  icon: CalendarCheck2 },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { href: "/clientes",  label: "Clientes",  icon: Users },
      { href: "/servicos",  label: "Serviços",  icon: Scissors },
      { href: "/equipe",    label: "Equipe",    icon: UserCog },
    ],
  },
  {
    label: "COMUNICAÇÃO",
    items: [
      { href: "/mensagens", label: "Mensagens", icon: MessageSquare, badgeKey: "messages" },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "FINANCEIRO",
    items: [
      { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
      { href: "/caixa",      label: "Caixa",      icon: Archive },
      { href: "/relatorios", label: "Relatórios", icon: BarChart2 },
    ],
  },
  {
    label: "CONTA",
    items: [
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

interface SidebarProps {
  venueName?: string;
  venueLocation?: string;
  userName?: string;
  userRole?: string;
  unreadMessages?: number;
  plan?: "basic" | "pro";
}

export function Sidebar({
  venueName = "Meu Negócio",
  venueLocation = "",
  userName = "",
  userRole = "Owner",
  unreadMessages = 0,
  plan = "basic",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-screen overflow-y-auto"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.50)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <TrymLogo iconSize={30} />
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[9px] font-bold tracking-[0.12em] text-text-tertiary uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badgeKey }) => {
                const isActive =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href));
                const badge = badgeKey === "messages" && unreadMessages > 0 ? unreadMessages : 0;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-text-primary"
                        : "text-text-tertiary hover:text-text-primary",
                    )}
                    style={isActive ? {
                      background: "rgba(127,209,193,0.15)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                    } : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-y-1 left-0 w-0.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive ? "text-brand-500" : "text-text-tertiary group-hover:text-text-secondary",
                      )}
                      strokeWidth={1.5}
                    />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral-500 px-1 text-[9px] font-bold text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade card */}
      {plan === "basic" && (
        <div className="mx-2 mb-3 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(127,209,193,0.20) 0%, rgba(91,181,164,0.12) 100%)",
            border: "1px solid rgba(127,209,193,0.30)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
          }}>
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="h-3.5 w-3.5 text-brand-500" strokeWidth={1.5} />
              <span className="text-xs font-semibold text-text-primary">Upgrade para Pro</span>
            </div>
            <p className="text-[11px] leading-snug mb-3 text-text-tertiary">
              WhatsApp automático, relatórios e comissões.
            </p>
            <Link
              href="/configuracoes"
              className="block w-full rounded-xl px-3 py-1.5 text-center text-xs font-semibold text-ink transition-all hover:brightness-105 active:scale-95"
              style={{
                background: "var(--accent)",
                boxShadow: "0 4px 12px rgba(127,209,193,0.35)",
              }}
            >
              Ver planos
            </Link>
          </div>
        </div>
      )}

      {/* Venue info */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-ink"
            style={{ background: "linear-gradient(135deg, var(--accent-glow) 0%, var(--accent) 100%)", boxShadow: "0 2px 8px rgba(127,209,193,0.30)" }}
          >
            {venueName[0]?.toUpperCase() ?? "N"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-text-primary">{venueName}</p>
            {venueLocation && (
              <p className="truncate text-[10px] text-text-tertiary">{venueLocation}</p>
            )}
          </div>
        </div>
      </div>

      {/* User profile */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <Link
          href="/configuracoes"
          className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-all duration-200 hover:bg-brand-50/60"
        >
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-ink"
            style={{ background: "linear-gradient(135deg, var(--accent-glow) 0%, var(--accent) 100%)" }}
          >
            {userName ? userName[0]?.toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="truncate text-xs font-semibold text-text-primary">{userName || "Usuário"}</p>
            <p className="truncate text-[10px] text-text-tertiary">{userRole}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" strokeWidth={1.5} />
        </Link>
      </div>
    </aside>
  );
}
