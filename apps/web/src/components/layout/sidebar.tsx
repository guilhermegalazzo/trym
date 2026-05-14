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
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "PRINCIPAL",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendario", label: "Calendário", icon: CalendarDays },
      { href: "/agendamentos", label: "Agendamentos", icon: CalendarCheck2 },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/servicos", label: "Serviços", icon: Scissors },
      { href: "/equipe", label: "Equipe", icon: UserCog },
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
      { href: "/caixa",      label: "Caixa",      icon: Archive   },
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
    <aside className="hidden w-56 flex-shrink-0 bg-surface-0 border-r border-border-subtle lg:flex flex-col h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <TrymLogo iconSize={30} />
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-text-tertiary uppercase">
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
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-y-0.5 left-0 w-0.5 rounded-full bg-brand-600"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive ? "text-brand-600" : "text-text-tertiary group-hover:text-text-primary"
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-coral-500 px-1 text-[9px] font-bold text-white">
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
        <div className="mx-2 mb-3 rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #042F2E 0%, #021D1C 100%)" }}>
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-coral-400" />
              <span className="text-xs font-semibold text-white">Upgrade para Pro</span>
            </div>
            <p className="text-[11px] leading-snug mb-3" style={{ color: "rgb(204 251 241 / 0.7)" }}>
              WhatsApp automático, relatórios e comissões.
            </p>
            <Link
              href="/configuracoes/plano"
              className="block w-full rounded-lg px-3 py-1.5 text-center text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #F472B6 0%, #EC4899 100%)" }}
            >
              Ver planos
            </Link>
          </div>
        </div>
      )}

      {/* Venue info */}
      <div className="border-t border-border-subtle px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)" }}
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
      <div className="border-t border-border-subtle px-3 py-3">
        <button className="flex w-full items-center gap-2.5 rounded-lg hover:bg-surface-2 px-1.5 py-1.5 transition-colors">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)" }}
          >
            {userName ? userName[0]?.toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="truncate text-xs font-semibold text-text-primary">{userName || "Usuário"}</p>
            <p className="truncate text-[10px] text-text-tertiary">{userRole}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
