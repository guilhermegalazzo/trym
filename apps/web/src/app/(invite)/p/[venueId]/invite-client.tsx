"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Clock, Scissors, PawPrint, Dumbbell, ChevronRight, Star, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Venue = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  address_line: string | null;
  phone: string | null;
  categories: { name: string; slug: string } | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
};

type TeamMember = {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
};

// ─── Category theming ─────────────────────────────────────────────────────────

const THEMES: Record<string, {
  from: string; via: string; to: string;
  blob1: string; blob2: string;
  icon: React.ElementType;
  badge: string;
  cta: string;
  ctaHover: string;
}> = {
  beleza: {
    from: "from-[#0a2a28]", via: "via-[#0f4f48]", to: "to-[#1a1025]",
    blob1: "bg-brand-500",  blob2: "bg-coral-400",
    icon: Scissors,
    badge: "bg-brand-500/20 text-brand-300 border-brand-400/30",
    cta: "from-brand-500 to-brand-600",
    ctaHover: "hover:from-brand-400 hover:to-brand-500",
  },
  pet: {
    from: "from-[#0a2420]", via: "via-[#0d3d35]", to: "to-[#0a1a2e]",
    blob1: "bg-emerald-500", blob2: "bg-teal-400",
    icon: PawPrint,
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    cta: "from-emerald-500 to-teal-600",
    ctaHover: "hover:from-emerald-400 hover:to-teal-500",
  },
  fitness: {
    from: "from-[#1a1000]", via: "via-[#3d2200]", to: "to-[#1a0a10]",
    blob1: "bg-amber-500",  blob2: "bg-orange-400",
    icon: Dumbbell,
    badge: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    cta: "from-amber-500 to-orange-600",
    ctaHover: "hover:from-amber-400 hover:to-orange-500",
  },
};
const DEFAULT_THEME = THEMES.beleza;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(cents / 100);
}

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function InviteClient({ venue, services, team }: { venue: Venue; services: Service[]; team: TeamMember[] }) {
  const [visible, setVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const slug  = venue.categories?.slug ?? "beleza";
  const theme = THEMES[slug] ?? DEFAULT_THEME;
  const Icon  = theme.icon;
  const location = [venue.city, venue.state].filter(Boolean).join(", ");
  const displayedServices = showAll ? services : services.slice(0, 6);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className={cn("relative min-h-screen flex flex-col items-center justify-center px-5 pt-16 pb-32 bg-gradient-to-br overflow-hidden", theme.from, theme.via, theme.to)}>

        {/* Animated blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={cn("animate-blob absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-25 blur-3xl", theme.blob1)} />
          <div className={cn("animate-blob2 absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl", theme.blob2)} />
          <div className={cn("animate-blob absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl", theme.blob2)} style={{ animationDelay: "4s" }} />
        </div>

        {/* Grain texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

        {/* Powered by Trym */}
        <div className={cn("absolute top-5 right-5 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm transition-all duration-700", visible ? "opacity-100" : "opacity-0")}>
          <Sparkles className="h-3 w-3 text-white/60" />
          <span className="text-[10px] font-semibold text-white/50 tracking-wide">Trym</span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">

          {/* Logo circle */}
          <div className={cn("animate-fade-up animation-delay-100 relative mb-6", visible ? "" : "opacity-0")}>
            <div className="relative h-28 w-28">
              {/* Ping ring */}
              <div className="animate-ping-slow absolute inset-0 rounded-full border-2 border-white/20" />
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-white/20 backdrop-blur-sm" />
              {/* Inner circle */}
              <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <span className="text-3xl font-black text-white tracking-tight">
                  {venue.name[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Category badge */}
          <div className={cn("animate-fade-up animation-delay-200 mb-4", visible ? "" : "opacity-0")}>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm", theme.badge)}>
              <Icon className="h-3 w-3" />
              {venue.categories?.name ?? "Serviços"}
            </span>
          </div>

          {/* Name */}
          <h1 className={cn("animate-fade-up animation-delay-300 text-4xl font-black text-white leading-tight tracking-tight mb-3", visible ? "" : "opacity-0")}>
            {venue.name}
          </h1>

          {/* Description */}
          {venue.description && (
            <p className={cn("animate-fade-up animation-delay-400 text-sm text-white/60 leading-relaxed mb-5", visible ? "" : "opacity-0")}>
              {venue.description}
            </p>
          )}

          {/* Location */}
          {location && (
            <div className={cn("animate-fade-up animation-delay-500 flex items-center gap-1.5 text-white/50 mb-8", visible ? "" : "opacity-0")}>
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs">{location}</span>
            </div>
          )}

          {/* Stats pills */}
          <div className={cn("animate-fade-up animation-delay-600 flex items-center gap-3 flex-wrap justify-center", visible ? "" : "opacity-0")}>
            {services.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <Scissors className="h-3.5 w-3.5 text-white/50" />
                <span className="text-xs font-semibold text-white/70">
                  {services.length} serviço{services.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {team.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <Users className="h-3.5 w-3.5 text-white/50" />
                <span className="text-xs font-semibold text-white/70">
                  {team.length} profissional{team.length > 1 ? "is" : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">Novo</span>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">Veja os serviços</span>
          <div className="h-8 w-5 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="h-1.5 w-1 rounded-full bg-white/40" style={{ animation: "fadeUp 1.5s ease-in-out infinite alternate" }} />
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="bg-[#0d0d0d] px-5 py-14">
          <div className="max-w-lg mx-auto">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">O que oferecemos</p>
                <h2 className="text-2xl font-bold text-white">Serviços</h2>
              </div>
              <span className="text-xs text-white/30">{services.length} disponíveis</span>
            </div>

            <div className="space-y-3">
              {displayedServices.map((svc, i) => (
                <div
                  key={svc.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Subtle gradient on hover */}
                  <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r", theme.cta)} style={{ opacity: 0.03 }} />

                  <div className="relative flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                      <Icon className="h-4 w-4 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{svc.name}</p>
                      {svc.description && (
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{svc.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold text-white">{fmtPrice(svc.price_cents)}</span>
                      <span className="flex items-center gap-1 text-[10px] text-white/30">
                        <Clock className="h-2.5 w-2.5" />
                        {fmtDuration(svc.duration_minutes)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {services.length > 6 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-4 w-full rounded-2xl border border-white/5 bg-white/[0.02] py-3 text-xs font-semibold text-white/40 hover:text-white/60 hover:border-white/10 transition-all"
              >
                {showAll ? "Ver menos" : `Ver todos os ${services.length} serviços`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── Team ─────────────────────────────────────────────────────────────── */}
      {team.length > 0 && (
        <section className="bg-[#080808] px-5 py-14">
          <div className="max-w-lg mx-auto">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Quem vai te atender</p>
              <h2 className="text-2xl font-bold text-white">Nossa equipe</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {team.map(member => (
                <div
                  key={member.id}
                  className="group flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] hover:-translate-y-1"
                >
                  {/* Avatar */}
                  <div className="relative mb-3">
                    <div className={cn("h-16 w-16 rounded-full bg-gradient-to-br flex items-center justify-center text-lg font-black text-white shadow-lg", theme.cta)}>
                      {member.avatar_url
                        ? <img src={member.avatar_url} alt={member.display_name} className="h-16 w-16 rounded-full object-cover" />
                        : initials(member.display_name)
                      }
                    </div>
                    {/* Online dot */}
                    <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#080808]" />
                  </div>
                  <p className="text-sm font-semibold text-white leading-tight">{member.display_name}</p>
                  {member.bio && (
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{member.bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Why book ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#0d0d0d] px-5 py-14">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { emoji: "⚡", label: "Rápido", sub: "Agende em segundos" },
              { emoji: "🔔", label: "Lembretes", sub: "Sem esquecer o horário" },
              { emoji: "💳", label: "Seguro", sub: "Pagamento protegido" },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <p className="text-xs font-semibold text-white/80">{item.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fixed CTA ────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 pb-safe">
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-6 px-5">
          <div className="max-w-lg mx-auto">
            <Link
              href={`/book/${venue.id}`}
              className={cn(
                "relative w-full flex items-center justify-center gap-2.5 overflow-hidden",
                "rounded-2xl bg-gradient-to-r px-6 py-4 font-bold text-white shadow-2xl",
                "transition-all duration-300 active:scale-[0.98]",
                theme.cta, theme.ctaHover,
              )}
            >
              {/* Shimmer overlay */}
              <div className="animate-shimmer pointer-events-none absolute inset-0" />

              <span className="relative text-base">Agendar agora</span>
              <ChevronRight className="relative h-5 w-5" />
            </Link>
            <p className="text-center text-[10px] text-white/25 mt-3 tracking-wide">
              Powered by <span className="font-semibold text-white/40">Trym</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom spacer for fixed CTA */}
      <div className="h-28" />
    </div>
  );
}
