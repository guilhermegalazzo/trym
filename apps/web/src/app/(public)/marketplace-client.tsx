"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, MapPin, Scissors, PawPrint, Dumbbell, Star, ArrowRight, Sparkles } from "lucide-react";
import type { PublicVenue, PublicCategory } from "../page";

// ─── Category icons ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  beleza:  Scissors,
  pet:     PawPrint,
  fitness: Dumbbell,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beleza:  { bg: "bg-brand-50",  text: "text-brand-700",  border: "border-brand-200"  },
  pet:     { bg: "bg-coral-50",  text: "text-coral-600",  border: "border-coral-200"  },
  fitness: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
};

// ─── Venue card ───────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: PublicVenue }) {
  const slug = venue.categories?.slug ?? "beleza";
  const Icon = CATEGORY_ICONS[slug] ?? Scissors;
  const colors = CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.beleza;
  const initial = venue.name[0]?.toUpperCase() ?? "V";
  const location = [venue.city, venue.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/book/${venue.id}`}
      className="group flex flex-col rounded-2xl bg-white border border-border-subtle shadow-card hover:shadow-md hover:border-brand-200 transition-all duration-200 overflow-hidden"
    >
      {/* Header banner */}
      <div className="relative h-28 bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
        <span className="text-4xl font-black text-white/90">{initial}</span>
        <div className="absolute top-3 right-3">
          <span className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            colors.bg, colors.text, colors.border,
          )}>
            <Icon className="h-3 w-3" />
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
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {location}
          </p>
        )}
        {venue.description && (
          <p className="text-xs text-text-secondary line-clamp-2 flex-1">{venue.description}</p>
        )}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
            ))}
            <span className="ml-1 text-[10px] text-text-tertiary font-medium">Novo</span>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
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
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 py-20 px-6 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-brand-100 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Reserve em segundos, sem ligação
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight mb-4">
            Agende serviços perto de você
          </h1>
          <p className="text-brand-200 text-lg mb-10">
            Beleza, pet e fitness — os melhores profissionais do Brasil em um só lugar.
          </p>

          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg max-w-lg mx-auto">
            <Search className="h-5 w-5 text-text-tertiary flex-shrink-0" />
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

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                !activeCategory
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-text-secondary border border-border-subtle hover:border-brand-300 hover:text-brand-600",
              )}
            >
              Todos
            </button>
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat.slug] ?? Scissors;
              const active = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(active ? null : cat.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all border",
                    active
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-white text-text-secondary border-border-subtle hover:border-brand-300 hover:text-brand-600",
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
          <h2 className="text-xl font-bold text-text-primary">
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 mb-4">
              <Search className="h-8 w-8 text-brand-400" />
            </div>
            <p className="text-base font-bold text-text-primary mb-1">Nenhum resultado encontrado</p>
            <p className="text-sm text-text-tertiary max-w-xs">
              Tente buscar por outro nome ou remova os filtros.
            </p>
            <button
              onClick={() => { setSearch(""); setActiveCategory(null); }}
              className="mt-4 text-sm font-semibold text-brand-600 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(v => <VenueCard key={v.id} venue={v} />)}
          </div>
        )}

        {/* Empty state for no venues at all */}
        {venues.length === 0 && (
          <div className="mt-12 rounded-2xl border-2 border-dashed border-border-default p-16 text-center">
            <p className="text-base font-semibold text-text-primary mb-2">
              Seja o primeiro do Trym
            </p>
            <p className="text-sm text-text-tertiary mb-6">
              Nenhum estabelecimento cadastrado ainda. Junte-se e alcance novos clientes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Cadastrar meu negócio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
