"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Calendar, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userEmail: string;
  userName: string;
  onMenuToggle?: () => void;
}

type UpcomingApt = {
  id: string;
  scheduled_at: string;
  venue_customers: { full_name: string } | null;
  appointment_items: Array<{ description: string }>;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  if (isToday) return `Hoje, ${fmtTime(iso)}`;
  if (isTomorrow) return `Amanhã, ${fmtTime(iso)}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + ` ${fmtTime(iso)}`;
}

export function Header({ userEmail, userName, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [bellOpen, setBellOpen]           = useState(false);
  const [notifications, setNotifications] = useState<UpcomingApt[]>([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : userEmail[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!venue) return setLoading(false);

      const now = new Date().toISOString();
      const in48h = new Date(Date.now() + 48 * 3600_000).toISOString();

      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_at, venue_customers(full_name), appointment_items(description)")
        .eq("venue_id", venue.id)
        .gte("scheduled_at", now)
        .lte("scheduled_at", in48h)
        .in("status", ["confirmed"])
        .order("scheduled_at")
        .limit(10);

      const apts = (data ?? []) as unknown as UpcomingApt[];
      setNotifications(apts);

      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59);
      setUnread(apts.filter(a => new Date(a.scheduled_at) <= todayEnd).length);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="flex h-14 items-center justify-between px-4 lg:px-6 gap-3"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #EBEBEB",
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-text-tertiary hover:bg-brand-50/60 hover:text-text-secondary transition-all lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <div className="flex items-center gap-3 ml-auto">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setBellOpen(v => !v); setUnread(0); }}
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
              bellOpen
                ? "text-brand-600"
                : "text-text-tertiary hover:text-text-secondary",
            )}
            style={bellOpen ? { background: "rgba(127,209,193,0.15)" } : undefined}
            title="Notificações"
          >
            <Bell className="h-4 w-4" strokeWidth={1.5} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral-500 px-0.5 text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1px solid #E8E8E8",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
                <p className="text-sm font-semibold text-text-primary">Próximos agendamentos</p>
                <button
                  onClick={() => setBellOpen(false)}
                  className="rounded-lg p-1 text-text-tertiary hover:text-text-secondary hover:bg-brand-50/60 transition-all"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading && (
                  <div className="py-6 text-center text-xs text-text-tertiary animate-pulse">Carregando…</div>
                )}
                {!loading && notifications.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center px-4">
                    <Calendar className="h-7 w-7 text-brand-300 mb-2" strokeWidth={1.5} />
                    <p className="text-xs font-medium text-text-secondary">Sem agendamentos nas próximas 48h</p>
                  </div>
                )}
                {notifications.map((apt, i) => (
                  <button
                    key={apt.id}
                    onClick={() => { setBellOpen(false); router.push("/agendamentos"); }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-brand-50/40"
                    style={i > 0 ? { borderTop: "1px solid #F0F0F0" } : undefined}
                  >
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(127,209,193,0.15)" }}>
                      <Calendar className="h-3.5 w-3.5 text-brand-600" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {apt.venue_customers?.full_name ?? "Cliente"}
                      </p>
                      <p className="text-[11px] text-text-tertiary truncate">
                        {apt.appointment_items.map(i => i.description).join(", ") || "Agendamento"}
                      </p>
                      <p className="text-[11px] font-medium text-brand-600 mt-0.5">{fmtDate(apt.scheduled_at)}</p>
                    </div>
                  </button>
                ))}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2.5" style={{ borderTop: "1px solid #F0F0F0", background: "#FAFAFA" }}>
                  <button
                    onClick={() => { setBellOpen(false); router.push("/agendamentos"); }}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Ver todos os agendamentos →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User + sign out */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-ink"
              style={{
                background: "linear-gradient(135deg, var(--accent-glow) 0%, var(--accent) 100%)",
                boxShadow: "0 2px 8px rgba(127,209,193,0.30)",
              }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-text-primary leading-none">{userName}</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-text-tertiary hover:bg-coral-50/80 hover:text-coral-600 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
