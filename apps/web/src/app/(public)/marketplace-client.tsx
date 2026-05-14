"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, MapPin, Scissors, PawPrint, Dumbbell, ArrowRight, Sparkles } from "lucide-react";
import type { PublicVenue, PublicCategory } from "./types";

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_CONFIG: Record<string, {
  icon: React.ElementType;
  bannerFrom: string;
  bannerTo: string;
  pill: string;
  pillText: string;
  activePill: string;
  activePillText: string;
}> = {
  beleza: {
    icon: Scissors,
    bannerFrom: "from-rose-400", bannerTo: "to-pink-500",
    pill: "bg-rose-50 border-rose-200 text-rose-700",
    pillText: "text-rose-700",
    activePill: "bg-rose-500 border-rose-500 text-white",
    activePillText: "text-white",
  },
  pet: {
    icon: PawPrint,
    bannerFrom: "from-emerald-400", bannerTo: "to-teal-500",
    pill: "bg-emerald-50 border-emerald-200 text-emerald-700",
    pillText: "text-emerald-700",
    activePill: "bg-emerald-500 border-emerald-500 text-white",
    activePillText: "text-white",
  },
  fitness: {
    icon: Dumbbell,
    bannerFrom: "from-orange-400", bannerTo: "to-amber-500",
    pill: "bg-orange-50 border-orange-200 text-orange-700",
    pillText: "text-orange-700",
    activePill: "bg-orange-500 border-orange-500 text-white",
    activePillText: "text-white",
  },
};

const DEFAULT_CFG = CAT_CONFIG.beleza;

// ─── Venue card ───────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: PublicVenue }) {
  const slug = venue.categories?.slug ?? "beleza";
  const cfg = CAT_CONFIG[slug] ?? DEFAULT_CFG;
  const Icon = cfg.icon;
  const initial = venue.name[0]?.toUpperCase() ?? "V";
  const location = [venue.city, venue.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/book/${venue.id}`}
      className="group flex flex-col rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Warm gradient banner */}
      <div className={cn(
        "relative h-28 bg-gradient-to-br flex items-center justify-center",
        cfg.bannerFrom, cfg.bannerTo,
      )}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/40">
          <span className="text-2xl font-black text-white">{initial}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-neutral-700">
            <Icon className="h-3 w-3" />
            {venue.categories?.name ?? "Serviço"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        <p className="text-sm font-bold text-neutral-900 group-hover:text-rose-600 transition-colors line-clamp-1">
          {venue.name}
        </p>
        {location && (
          <p className="flex items-center gap-1 text-xs text-neutral-400">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {location}
          </p>
        )}
        {venue.description && (
          <p className="text-xs text-neutral-500 line-clamp-2 flex-1">{venue.description}</p>
        )}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <span className="text-[10px] text-neutral-400 font-medium">Agendamento online</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-500 group-hover:gap-2 transition-all">
            Agendar <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  venues: PublicVenue[];
  categories: PublicCategory[];
}

export function MarketplaceClient({ venues, categories }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = venues.filter(v => {
    const matchesSearch =
      !search.trim() ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !activeCategory || v.categories?.slug === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FFFAF6] font-sans antialiased">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 py-24 px-6">
        {/* Soft warm blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -top-20 right-0 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="animate-blob2 absolute -bottom-16 left-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-rose-200/60 px-4 py-1.5 text-xs font-semibold text-rose-600 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Reserve em segundos, sem ligação
          </div>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-neutral-900 mb-4">
            Agende serviços<br />
            <span className="text-rose-500">perto de você</span>
          </h1>
          <p className="text-neutral-500 text-lg mb-10 max-w-md mx-auto">
            Beleza, pet e fitness — os melhores profissionais do Brasil em um só lugar.
          </p>

          {/* Search bar */}
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-md border border-neutral-100 max-w-lg mx-auto">
            <Search className="h-5 w-5 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por salão, cidade ou serviço…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-all border",
                !activeCategory
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                  : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400 hover:text-neutral-700",
              )}
            >
              Todos
            </button>
            {categories.map(cat => {
              const cfg = CAT_CONFIG[cat.slug] ?? DEFAULT_CFG;
              const Icon = cfg.icon;
              const active = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(active ? null : cat.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all border",
                    active ? cfg.activePill : `bg-white ${cfg.pill}`,
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-neutral-900">
            {activeCategory
              ? categories.find(c => c.slug === activeCategory)?.name
              : "Todos os estabelecimentos"}
          </h2>
          <span className="text-sm text-neutral-400">
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>

        {/* Venue grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 mb-4">
              <Search className="h-8 w-8 text-rose-300" />
            </div>
            <p className="text-base font-bold text-neutral-800 mb-1">Nenhum resultado encontrado</p>
            <p className="text-sm text-neutral-400 max-w-xs">
              Tente buscar por outro nome ou remova os filtros.
            </p>
            <button
              onClick={() => { setSearch(""); setActiveCategory(null); }}
              className="mt-4 text-sm font-semibold text-rose-500 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(v => <VenueCard key={v.id} venue={v} />)}
          </div>
        )}

        {/* Empty state — no venues registered yet */}
        {venues.length === 0 && (
          <div className="mt-12 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-rose-400" />
            </div>
            <p className="text-base font-semibold text-neutral-800 mb-2">
              Seja o primeiro do Trym
            </p>
            <p className="text-sm text-neutral-400 mb-6">
              Nenhum estabelecimento cadastrado ainda. Junte-se e alcance novos clientes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition-colors"
            >
              Cadastrar meu negócio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
