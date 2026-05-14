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
}> = {
  beleza:  { icon: Scissors, bannerFrom: "from-rose-400",    bannerTo: "to-pink-500"   },
  pet:     { icon: PawPrint, bannerFrom: "from-emerald-400", bannerTo: "to-teal-500"   },
  fitness: { icon: Dumbbell, bannerFrom: "from-orange-400",  bannerTo: "to-amber-500"  },
};
const DEFAULT_CFG = CAT_CONFIG.beleza;

// ─── Venue card ───────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: PublicVenue }) {
  const slug     = venue.categories?.slug ?? "beleza";
  const cfg      = CAT_CONFIG[slug] ?? DEFAULT_CFG;
  const Icon     = cfg.icon;
  const initial  = venue.name[0]?.toUpperCase() ?? "V";
  const location = [venue.city, venue.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/book/${venue.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "#ffffff",
        border: "1px solid #E8E8E8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Gradient banner */}
      <div className={cn(
        "relative h-28 bg-gradient-to-br flex items-center justify-center",
        cfg.bannerFrom, cfg.bannerTo,
      )}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/40">
          <span className="text-2xl font-black text-white">{initial}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-neutral-700">
            <Icon className="h-3 w-3" strokeWidth={1.5} />
            {venue.categories?.name ?? "Serviço"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        <p className="text-sm font-bold text-text-primary group-hover:text-brand-600 transition-colors line-clamp-1">
          {venue.name}
        </p>
        {location && (
          <p className="flex items-center gap-1 text-xs text-text-tertiary">
            <MapPin className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
            {location}
          </p>
        )}
        {venue.description && (
          <p className="text-xs text-text-tertiary line-clamp-2 flex-1">{venue.description}</p>
        )}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <span className="text-[10px] text-text-tertiary font-medium">Agendamento online</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
            Agendar <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
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
  const [search, setSearch]               = useState("");
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
    <div className="min-h-screen" style={{ background: "var(--color-surface-1)" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden py-20 px-6"
        style={{ background: "#FAF7F2", borderBottom: "1px solid #EBEBEB" }}>
        <div className="relative mx-auto max-w-2xl text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-700 mb-6"
            style={{
              background: "rgba(127,209,193,0.10)",
              border: "1px solid rgba(127,209,193,0.25)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-500" strokeWidth={1.5} />
            Reserve em segundos, sem ligação
          </div>

          <h1
            className="text-5xl font-black leading-tight text-text-primary mb-4"
            style={{ letterSpacing: "-0.03em" }}
          >
            Agende serviços<br />
            <span className="text-gradient-accent">perto de você</span>
          </h1>
          <p className="text-text-tertiary text-lg mb-10 max-w-md mx-auto">
            Beleza, pet e fitness — os melhores profissionais do Brasil em um só lugar.
          </p>

          {/* Glass search bar */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 max-w-lg mx-auto rounded-2xl"
            style={{
              background: "#ffffff",
              border: "1px solid #DEDEDE",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <Search className="h-5 w-5 text-text-tertiary flex-shrink-0" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Buscar por salão, cidade ou serviço…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
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
              className="rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={!activeCategory ? {
                background: "#0A0A0A",
                color: "#fff",
              } : {
                background: "#ffffff",
                border: "1px solid #E0E0E0",
                color: "#6B6B6B",
              }}
            >
              Todos
            </button>
            {categories.map(cat => {
              const cfg    = CAT_CONFIG[cat.slug] ?? DEFAULT_CFG;
              const Icon   = cfg.icon;
              const active = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(active ? null : cat.slug)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
                  style={active ? {
                    background: "var(--accent)",
                    color: "var(--ink)",
                  } : {
                    background: "#ffffff",
                    border: "1px solid #E0E0E0",
                    color: "#6B6B6B",
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary" style={{ letterSpacing: "-0.02em" }}>
            {activeCategory
              ? categories.find(c => c.slug === activeCategory)?.name
              : "Todos os estabelecimentos"}
          </h2>
          <span className="text-sm text-text-tertiary">
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>

        {/* Venue grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
              style={{ background: "rgba(127,209,193,0.12)", border: "1px solid rgba(127,209,193,0.20)" }}
            >
              <Search className="h-8 w-8 text-brand-400" strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-text-primary mb-1">Nenhum resultado encontrado</p>
            <p className="text-sm text-text-tertiary max-w-xs">
              Tente buscar por outro nome ou remova os filtros.
            </p>
            <button
              onClick={() => { setSearch(""); setActiveCategory(null); }}
              className="mt-4 text-sm font-semibold text-brand-600 hover:underline transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(v => <VenueCard key={v.id} venue={v} />)}
          </div>
        )}

        {/* Empty state */}
        {venues.length === 0 && (
          <div
            className="mt-12 p-16 text-center rounded-2xl"
            style={{
              border: "2px dashed rgba(127,209,193,0.30)",
              background: "rgba(255,255,255,0.40)",
            }}
          >
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(127,209,193,0.12)" }}>
              <Sparkles className="h-8 w-8 text-brand-500" strokeWidth={1.5} />
            </div>
            <p className="text-base font-semibold text-text-primary mb-2">Seja o primeiro do Trym</p>
            <p className="text-sm text-text-tertiary mb-6">
              Nenhum estabelecimento cadastrado ainda. Junte-se e alcance novos clientes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-ink transition-all duration-200 hover:brightness-105"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(127,209,193,0.35)" }}
            >
              Cadastrar meu negócio <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
