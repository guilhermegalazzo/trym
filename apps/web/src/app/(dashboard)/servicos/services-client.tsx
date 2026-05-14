"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Scissors, Clock, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
  display_order: number;
  subcategory_id: string | null;
};

type Subcategory = { id: string; name: string };

type ServiceForm = {
  name: string;
  description: string;
  duration_minutes: number;
  price_cents_input: string;
  subcategory_id: string;
  is_active: boolean;
};

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  duration_minutes: 60,
  price_cents_input: "",
  subcategory_id: "",
  is_active: true,
};

const DURATIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ServiceModal({
  form, setForm, subcategories, onClose, onSave, saving, title,
}: {
  form: ServiceForm;
  setForm: (f: ServiceForm) => void;
  subcategories: Subcategory[];
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-modal p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Corte feminino, Banho e tosa"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhe o serviço para o cliente…"
              rows={2}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Duração *</label>
              <select
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{formatDuration(d)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Preço (R$) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.price_cents_input}
                onChange={(e) => setForm({ ...form, price_cents_input: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {subcategories.length > 0 && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-700">Subcategoria</label>
              <select
                value={form.subcategory_id}
                onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Sem subcategoria</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={cn("relative inline-flex h-5 w-9 rounded-full transition-colors",
                form.is_active ? "bg-brand-500" : "bg-neutral-300")}
            >
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                form.is_active ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <span className="text-sm font-medium text-neutral-700">Serviço ativo</span>
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.name.trim() || !form.price_cents_input}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando…" : <><Check className="h-4 w-4" /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function ServicosClient({
  venueId, initialServices, subcategories,
}: {
  venueId: string;
  initialServices: Service[];
  subcategories: Subcategory[];
}) {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function priceToCents(input: string): number {
    // Handle BR formats: "1.500,00" → strip thousand dots first, then swap decimal comma
    const stripped = input.replace(/\./g, "").replace(",", ".");
    return Math.round(parseFloat(stripped || "0") * 100);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModal("create");
  }

  function openEdit(service: Service) {
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration_minutes: service.duration_minutes,
      price_cents_input: (service.price_cents / 100).toFixed(2).replace(".", ","),
      subcategory_id: service.subcategory_id ?? "",
      is_active: service.is_active,
    });
    setEditingId(service.id);
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      venue_id: venueId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_minutes: form.duration_minutes,
      price_cents: priceToCents(form.price_cents_input),
      subcategory_id: form.subcategory_id || null,
      is_active: form.is_active,
    };

    if (modal === "create") {
      const { data, error } = await supabase
        .from("services")
        .insert({ ...payload, display_order: services.length })
        .select()
        .single();
      if (!error && data) setServices((prev) => [...prev, data as Service]);
    } else if (editingId) {
      const { data, error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (!error && data)
        setServices((prev) => prev.map((s) => (s.id === editingId ? (data as Service) : s)));
    }

    setSaving(false);
    setModal(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    setDeleteConfirm(null);
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) setServices((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  }

  async function toggleActive(service: Service) {
    const { data } = await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id)
      .select()
      .single();
    if (data) setServices((prev) => prev.map((s) => (s.id === service.id ? (data as Service) : s)));
  }

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {modal && (
        <ServiceModal
          form={form}
          setForm={setForm}
          subcategories={subcategories}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          title={modal === "create" ? "Novo serviço" : "Editar serviço"}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 font-display">Serviços</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {services.length} {services.length === 1 ? "serviço cadastrado" : "serviços cadastrados"}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo serviço
          </button>
        </div>

        {/* Search */}
        {services.length > 0 && (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar serviço…"
            className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        )}

        {/* Empty state */}
        {services.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 mb-4">
              <Scissors className="h-7 w-7 text-brand-500" />
            </div>
            <p className="text-base font-semibold text-neutral-900">Nenhum serviço cadastrado</p>
            <p className="mt-1 text-sm text-neutral-500 max-w-xs">
              Adicione os serviços que você oferece para que clientes possam agendar online.
            </p>
            <button
              onClick={openCreate}
              className="mt-6 flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro serviço
            </button>
          </div>
        )}

        {/* Service cards */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => {
              const sub = subcategories.find((s) => s.id === service.subcategory_id);
              return (
                <div
                  key={service.id}
                  className={cn("rounded-xl bg-white shadow-card p-5 flex flex-col gap-3 transition-opacity",
                    !service.is_active && "opacity-60")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 text-sm truncate">{service.name}</p>
                      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub.name}</p>}
                    </div>
                    <button onClick={() => toggleActive(service)} title={service.is_active ? "Desativar" : "Ativar"}>
                      {service.is_active
                        ? <ToggleRight className="h-5 w-5 text-brand-500" />
                        : <ToggleLeft className="h-5 w-5 text-neutral-300" />}
                    </button>
                  </div>

                  {service.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {formatPrice(service.price_cents)}
                    </span>
                  </div>

                  {deleteConfirm === service.id ? (
                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                      <p className="flex-1 text-xs text-neutral-500">Excluir este serviço?</p>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Cancelar</button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deleting === service.id}
                        className="rounded-lg bg-red-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                        {deleting === service.id ? "Excluindo…" : "Excluir"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1 border-t border-neutral-100">
                      <button
                        onClick={() => openEdit(service)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(service.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && services.length > 0 && (
          <p className="text-sm text-neutral-500 text-center py-10">
            Nenhum serviço encontrado para <strong>&ldquo;{search}&rdquo;</strong>.
          </p>
        )}
      </div>
    </>
  );
}
