"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin, Clock, Scissors, PawPrint, Dumbbell,
  ChevronRight, Star, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Venue = {
  id: string; name: string; description: string | null;
  city: string | null; state: string | null; address_line: string | null;
  categories: { name: string; slug: string } | null;
};
type Service = {
  id: string; name: string; description: string | null;
  price_cents: number; duration_minutes: number;
};
type TeamMember = {
  id: string; display_name: string; bio: string | null; avatar_url: string | null;
};

// ─── Category config ──────────────────────────────────────────────────────────

const CAT: Record<string, {
  icon: React.ElementType;
  accent: string;       // button / badge bg
  accentText: string;   // badge text
  heroFrom: string;     // hero gradient start
  heroTo: string;       // hero gradient end
  avatarFrom: string;
  avatarTo: string;
  dot: string;
}> = {
  beleza: {
    icon: Scissors,
    accent: "bg-rose-500",         accentText: "text-white",
    heroFrom: "from-rose-50",      heroTo:   "to-amber-50",
    avatarFrom: "from-rose-400",   avatarTo: "to-pink-500",
    dot: "bg-rose-400",
  },
  pet: {
    icon: PawPrint,
    accent: "bg-emerald-500",      accentText: "text-white",
    heroFrom: "from-emerald-50",   heroTo:   "to-teal-50",
    avatarFrom: "from-emerald-400",avatarTo: "to-teal-500",
    dot: "bg-emerald-400",
  },
  fitness: {
    icon: Dumbbell,
    accent: "bg-orange-500",       accentText: "text-white",
    heroFrom: "from-orange-50",    heroTo:   "to-amber-50",
    avatarFrom: "from-orange-400", avatarTo: "to-amber-500",
    dot: "bg-orange-400",
  },
};
const DEFAULT_CAT = CAT.beleza;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 0,
  }).format(cents / 100);
}
function fmtDur(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteClient({
  venue, services, team,
}: {
  venue: Venue; services: Service[]; team: TeamMember[];
}) {
  const [ready, setReady] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  const slug   = venue.categories?.slug ?? "beleza";
  const cat    = CAT[slug] ?? DEFAULT_CAT;
  const Icon   = cat.icon;
  const addr   = [venue.address_line, venue.city, venue.state].filter(Boolean).join(", ");
  const list   = showAll ? services : services.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FFFAF6] font-sans antialiased">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className={cn(
        "relative overflow-hidden bg-gradient-to-br min-h-[92svh] flex flex-col items-center justify-center px-6 pb-32 pt-20",
        cat.heroFrom, cat.heroTo,
      )}>
        {/* Soft blobs — warm tones, very light */}
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -top-24 -right-24 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="animate-blob2 absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        </div>

        {/* Trym badge */}
        <div className={cn(
          "absolute top-5 right-5 flex items-center gap-1.5 rounded-full border border-black/8 bg-white/60 px-3 py-1.5 backdrop-blur-sm transition-all duration-700 shadow-sm",
          ready ? "opacity-100" : "opacity-0",
        )}>
          <div className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">Trym</span>
        </div>

        <div className={cn(
          "relative z-10 flex flex-col items-center text-center transition-all duration-700",
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}>

          {/* Avatar circle */}
          <div className="relative mb-7">
            <div className={cn(
              "h-24 w-24 rounded-full bg-gradient-to-br flex items-center justify-center shadow-xl shadow-rose-200/50 ring-4 ring-white",
              cat.avatarFrom, cat.avatarTo,
            )}>
              <span className="text-3xl font-black text-white tracking-tight">
                {venue.name[0]?.toUpperCase()}
              </span>
            </div>
            {/* Verified dot */}
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
              <Check className="h-3.5 w-3.5 text-rose-500" strokeWidth={3} />
            </div>
          </div>

          {/* Category pill */}
          <div className={cn(
            "mb-3 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm",
            "text-neutral-600",
          )}>
            <Icon className="h-3 w-3" />
            {venue.categories?.name ?? "Beleza"}
          </div>

          {/* Name */}
          <h1 className="mb-2 text-[2.6rem] font-black leading-[1.05] tracking-tight text-neutral-900">
            {venue.name}
          </h1>

          {/* Description */}
          {venue.description && (
            <p className="mb-4 max-w-[280px] text-[15px] leading-relaxed text-neutral-500">
              {venue.description}
            </p>
          )}

          {/* Location */}
          {addr && (
            <div className="mb-8 flex items-center gap-1.5 text-[13px] text-neutral-400">
              <MapPin className="h-3.5 w-3.5" />
              {addr}
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {services.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-black/8 bg-white/70 px-4 py-2 text-xs font-semibold text-neutral-600 shadow-sm backdrop-blur-sm">
                <Icon className="h-3.5 w-3.5 text-neutral-400" />
                {services.length} {services.length === 1 ? "serviço" : "serviços"}
              </div>
            )}
            {team.length > 0 && (
              <div className="flex -space-x-2 mr-1">
                {team.slice(0, 3).map(m => (
                  <div key={m.id} className={cn(
                    "h-7 w-7 rounded-full ring-2 ring-white bg-gradient-to-br flex items-center justify-center",
                    cat.avatarFrom, cat.avatarTo,
                  )}>
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.display_name} className="h-full w-full rounded-full object-cover" />
                      : <span className="text-[9px] font-bold text-white">{initials(m.display_name)}</span>
                    }
                  </div>
                ))}
              </div>
            )}
            {team.length > 0 && (
              <span className="text-xs font-medium text-neutral-500">
                {team.length} profissional{team.length > 1 ? "is" : ""}
              </span>
            )}
            <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-amber-600">Destaque</span>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Serviços</p>
          <div className="h-8 w-5 rounded-full border-2 border-neutral-300 flex items-start justify-center pt-1.5">
            <div className="h-1.5 w-1 rounded-full bg-neutral-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="bg-white px-5 py-14">
          <div className="mx-auto max-w-lg">

            <div className="mb-7 flex items-end justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  O que oferecemos
                </p>
                <h2 className="text-2xl font-black text-neutral-900">Serviços</h2>
              </div>
              <span className="text-xs font-medium text-neutral-400">
                {services.length} disponíve{services.length === 1 ? "l" : "is"}
              </span>
            </div>

            <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-neutral-50/50 overflow-hidden">
              {list.map((svc) => (
                <div
                  key={svc.id}
                  className="group flex items-center gap-4 px-5 py-4 hover:bg-rose-50/50 transition-colors"
                >
                  <div className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                    cat.avatarFrom, cat.avatarTo,
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-neutral-800 leading-tight">{svc.name}</p>
                    {svc.description && (
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{svc.description}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                      <Clock className="h-3 w-3" />{fmtDur(svc.duration_minutes)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-black text-neutral-900">{fmtPrice(svc.price_cents)}</p>
                  </div>
                </div>
              ))}
            </div>

            {services.length > 5 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-3 w-full rounded-xl border border-neutral-200 bg-white py-3 text-xs font-semibold text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-all"
              >
                {showAll ? "Ver menos ↑" : `Ver todos os ${services.length} serviços ↓`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── TEAM ───────────────────────────────────────────────────────────── */}
      {team.length > 0 && (
        <section className="bg-[#FFFAF6] px-5 py-14">
          <div className="mx-auto max-w-lg">
            <div className="mb-7">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Quem vai te atender
              </p>
              <h2 className="text-2xl font-black text-neutral-900">Equipe</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {team.map(m => (
                <div
                  key={m.id}
                  className="group flex flex-col items-center rounded-2xl border border-neutral-100 bg-white p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative mb-3">
                    <div className={cn(
                      "h-16 w-16 rounded-full bg-gradient-to-br ring-2 ring-white shadow-md flex items-center justify-center",
                      cat.avatarFrom, cat.avatarTo,
                    )}>
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={m.display_name} className="h-full w-full rounded-full object-cover" />
                        : <span className="text-lg font-black text-white">{initials(m.display_name)}</span>
                      }
                    </div>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white", cat.dot)} />
                  </div>
                  <p className="text-sm font-bold text-neutral-800">{m.display_name}</p>
                  {m.bio && <p className="mt-1 text-xs text-neutral-400 line-clamp-2">{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY ────────────────────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-12">
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: "⚡️", title: "Rápido",     sub: "Agende em segundos" },
              { emoji: "🔔", title: "Lembretes",  sub: "Nunca perca o horário" },
              { emoji: "🔒", title: "Seguro",     sub: "Seus dados protegidos" },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-center">
                <span className="text-2xl mb-2">{item.emoji}</span>
                <p className="text-xs font-bold text-neutral-700">{item.title}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIXED CTA ──────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-6 px-5">
          <div className="mx-auto max-w-lg">
            <Link
              href={`/book/${venue.id}`}
              className={cn(
                "relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4",
                "bg-gradient-to-r shadow-lg shadow-rose-200 active:scale-[0.98] transition-all duration-200",
                cat.accent,
              )}
            >
              {/* subtle shimmer */}
              <div className="animate-shimmer pointer-events-none absolute inset-0" />
              <span className="relative text-[15px] font-bold text-white">Agendar agora</span>
              <ChevronRight className="relative h-5 w-5 text-white" strokeWidth={2.5} />
            </Link>
            <p className="mt-2.5 text-center text-[10px] font-medium text-neutral-400 tracking-wide">
              Powered by <span className="font-bold text-neutral-500">Trym</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-28" />
    </div>
  );
}
