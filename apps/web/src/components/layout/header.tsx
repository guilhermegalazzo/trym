"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userEmail: string;
  userName: string;
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

export function Header({ userEmail, userName }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [bellOpen, setBellOpen]         = useState(false);
  const [notifications, setNotifications] = useState<UpcomingApt[]>([]);
  const [unread, setUnread]             = useState(0);
  const [loading, setLoading]           = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : userEmail[0]?.toUpperCase() ?? "U";

  // Fetch upcoming appointments (next 48h) on mount
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

  // Close bell on outside click
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
    <header className="flex h-13 items-center justify-end border-b border-border-subtle bg-surface-0 px-6 gap-3">

      {/* Notification bell */}
      <div ref={bellRef} className="relative">
        <button
          onClick={() => { setBellOpen(v => !v); setUnread(0); }}
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            bellOpen ? "bg-brand-50 text-brand-600" : "text-text-tertiary hover:bg-surface-2 hover:text-text-secondary",
          )}
          title="Notificações"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral-500 px-0.5 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-border-subtle bg-white shadow-modal overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <p className="text-sm font-semibold text-text-primary">Próximos agendamentos</p>
              <button onClick={() => setBellOpen(false)} className="rounded-lg p-1 hover:bg-surface-1">
                <X className="h-3.5 w-3.5 text-text-tertiary" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
              {loading && (
                <div className="py-6 text-center text-xs text-text-tertiary animate-pulse">Carregando…</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center px-4">
                  <Calendar className="h-7 w-7 text-text-tertiary mb-2" />
                  <p className="text-xs font-medium text-text-secondary">Sem agendamentos nas próximas 48h</p>
                </div>
              )}
              {notifications.map(apt => (
                <button
                  key={apt.id}
                  onClick={() => { setBellOpen(false); router.push("/agendamentos"); }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-1 transition-colors"
                >
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
                    <Calendar className="h-3.5 w-3.5 text-brand-600" />
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
              <div className="px-4 py-2.5 border-t border-border-subtle bg-surface-1">
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

      {/* User info + sign out */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)" }}
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
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-tertiary hover:bg-surface-2 hover:text-text-secondary transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
