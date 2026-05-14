"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Search, Send, StickyNote, Calendar, MessageCircle, ChevronLeft, Smartphone } from "lucide-react";
import type { ConversationCustomer, WaMessage, AptEvent } from "./page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatFull(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-neutral-100 text-neutral-500",
  no_show: "bg-red-100 text-red-600",
};

function centsToReal(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Thread item types ────────────────────────────────────────────────────────

type ThreadItem =
  | { kind: "message"; data: WaMessage }
  | { kind: "appointment"; data: AptEvent };

function buildThread(
  messages: WaMessage[],
  appointments: AptEvent[],
  customerId: string,
): ThreadItem[] {
  const msgs = messages
    .filter(m => m.venue_customer_id === customerId)
    .map(m => ({ kind: "message" as const, data: m, ts: m.created_at }));
  const apts = appointments
    .filter(a => a.venue_customer_id === customerId)
    .map(a => ({ kind: "appointment" as const, data: a, ts: a.scheduled_at }));
  return [...msgs, ...apts]
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .map(({ kind, data }) => ({ kind, data } as ThreadItem));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: WaMessage }) {
  const isOut = msg.direction === "outbound";
  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
        isOut
          ? "rounded-tr-sm bg-brand-600 text-white"
          : "rounded-tl-sm bg-white border border-border-subtle text-text-primary shadow-sm",
      )}>
        <p>{msg.body ?? "—"}</p>
        <p className={cn("text-[10px] mt-1 text-right", isOut ? "text-brand-200" : "text-text-tertiary")}>
          {formatTime(msg.created_at)}
          {isOut && msg.status && (
            <span className="ml-1">
              {msg.status === "delivered" ? "✓✓" : msg.status === "read" ? "✓✓" : "✓"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function AppointmentCard({ apt }: { apt: AptEvent }) {
  const services = apt.appointment_items.map(i => i.description).join(", ");
  return (
    <div className="flex justify-center">
      <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 max-w-sm w-full">
        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
          <Calendar className="h-3.5 w-3.5 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-semibold text-text-primary truncate">{services || "Agendamento"}</p>
            <span className={cn("flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", STATUS_COLORS[apt.status] ?? "bg-neutral-100 text-neutral-500")}>
              {STATUS_LABELS[apt.status] ?? apt.status}
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary">{formatFull(apt.scheduled_at)}</p>
          {apt.total_cents > 0 && (
            <p className="text-[11px] text-text-secondary mt-0.5">{centsToReal(apt.total_cents)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Customer list item ───────────────────────────────────────────────────────

function CustomerItem({
  customer,
  lastMsg,
  selected,
  onClick,
}: {
  customer: ConversationCustomer;
  lastMsg: WaMessage | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = customer.full_name
    .split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        selected ? "bg-brand-50" : "hover:bg-surface-1",
      )}
    >
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600">
        <span className="text-sm font-bold text-white">{initials}</span>
        {lastMsg && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-0 bg-emerald-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className={cn("text-sm font-medium truncate", selected ? "text-brand-700" : "text-text-primary")}>
            {customer.full_name}
          </p>
          {lastMsg && (
            <span className="flex-shrink-0 text-[10px] text-text-tertiary ml-1">{formatTime(lastMsg.created_at)}</span>
          )}
        </div>
        <p className="text-xs text-text-tertiary truncate mt-0.5">
          {lastMsg ? (lastMsg.body ?? "Mensagem de mídia") : (customer.phone ?? "Sem telefone")}
        </p>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  venueId: string;
  waEnabled: boolean;
  customers: ConversationCustomer[];
  messages: WaMessage[];
  appointments: AptEvent[];
}

export function MensagensClient({ venueId, waEnabled, customers, messages, appointments }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery]               = useState("");
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [note, setNote]                 = useState("");
  const [notesSaving, setNotesSaving]   = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [showThread, setShowThread]     = useState(false);
  const [, startTransition]             = useTransition();
  const threadRef = useRef<HTMLDivElement>(null);

  const selected = customers.find(c => c.id === selectedId) ?? null;

  // Last message per customer (for list preview)
  const lastMsgMap = new Map<string, WaMessage>();
  for (const m of messages) {
    const existing = lastMsgMap.get(m.venue_customer_id);
    if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
      lastMsgMap.set(m.venue_customer_id, m);
    }
  }

  // Sorted customers: those with messages first, then by last_visit_at
  const filtered = customers
    .filter(c => c.full_name.toLowerCase().includes(query.toLowerCase()) ||
      (c.phone ?? "").includes(query))
    .sort((a, b) => {
      const aMsg = lastMsgMap.get(a.id);
      const bMsg = lastMsgMap.get(b.id);
      if (aMsg && bMsg) return new Date(bMsg.created_at).getTime() - new Date(aMsg.created_at).getTime();
      if (aMsg) return -1;
      if (bMsg) return 1;
      if (a.last_visit_at && b.last_visit_at)
        return new Date(b.last_visit_at).getTime() - new Date(a.last_visit_at).getTime();
      return 0;
    });

  const thread = selected ? buildThread(messages, appointments, selected.id) : [];

  // Scroll thread to bottom when messages change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [selectedId, thread.length]);

  function selectCustomer(id: string) {
    setSelectedId(id);
    setShowThread(true);
    setNote("");
    setNotesSuccess(false);
  }

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !note.trim()) return;
    setNotesSaving(true);
    const timestamp = new Date().toLocaleString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const existing = selected.private_notes ?? "";
    const newNote = existing
      ? `${existing}\n---\n[${timestamp}] ${note.trim()}`
      : `[${timestamp}] ${note.trim()}`;
    await supabase
      .from("venue_customers")
      .update({ private_notes: newNote })
      .eq("id", selected.id);
    setNotesSaving(false);
    setNote("");
    setNotesSuccess(true);
    setTimeout(() => setNotesSuccess(false), 3000);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border-default bg-surface-0 shadow-card">
      {/* ── Left panel: customer list ─────────────────────────────── */}
      <div className={cn(
        "flex flex-col border-r border-border-subtle bg-white",
        "w-full lg:w-72 flex-shrink-0",
        showThread ? "hidden lg:flex" : "flex",
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">Mensagens</h2>
          {waEnabled && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <Smartphone className="h-3 w-3" /> WA ativo
            </span>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border-subtle">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Buscar cliente…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-1 pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-4">
              <MessageCircle className="h-8 w-8 text-text-tertiary mb-2" />
              <p className="text-sm text-text-secondary">Nenhum cliente encontrado</p>
            </div>
          ) : filtered.map(c => (
            <CustomerItem
              key={c.id}
              customer={c}
              lastMsg={lastMsgMap.get(c.id)}
              selected={selectedId === c.id}
              onClick={() => selectCustomer(c.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: thread ───────────────────────────────────── */}
      <div className={cn(
        "flex flex-col flex-1 min-w-0",
        showThread ? "flex" : "hidden lg:flex",
      )}>
        {selected ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-white flex-shrink-0">
              <button
                onClick={() => setShowThread(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-surface-1"
              >
                <ChevronLeft className="h-4 w-4 text-text-secondary" />
              </button>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600">
                <span className="text-xs font-bold text-white">
                  {selected.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{selected.full_name}</p>
                <p className="text-xs text-text-tertiary">
                  {selected.phone ?? "Sem telefone"} · {selected.visit_count} visita{selected.visit_count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="ml-auto flex-shrink-0 text-right">
                <p className="text-xs font-semibold text-text-primary">{centsToReal(selected.total_spent_cents)}</p>
                <p className="text-[10px] text-text-tertiary">total gasto</p>
              </div>
            </div>

            {/* Thread body */}
            <div ref={threadRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-4 bg-surface-1">
              {thread.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-10 w-10 text-text-tertiary mb-2" />
                  <p className="text-sm font-semibold text-text-secondary">Sem histórico</p>
                  <p className="text-xs text-text-tertiary mt-1">Agendamentos e mensagens de WhatsApp aparecerão aqui.</p>
                </div>
              ) : thread.map((item, i) => (
                <div key={i}>
                  {item.kind === "message"
                    ? <MessageBubble msg={item.data} />
                    : <AppointmentCard apt={item.data} />
                  }
                </div>
              ))}
            </div>

            {/* Private notes */}
            <div className="border-t border-border-subtle bg-white flex-shrink-0">
              {selected.private_notes && (
                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <StickyNote className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-800 leading-relaxed whitespace-pre-wrap line-clamp-3">
                      {selected.private_notes}
                    </p>
                  </div>
                </div>
              )}
              <form onSubmit={handleSaveNote} className="flex items-end gap-2 px-4 py-3">
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Adicionar nota privada sobre este cliente…"
                    className="w-full resize-none rounded-xl border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  {notesSuccess && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Nota salva!</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={notesSaving || !note.trim()}
                  className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {!waEnabled && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg bg-surface-1 border border-border-subtle px-3 py-2 text-center">
                    <p className="text-xs text-text-tertiary">
                      <Smartphone className="inline h-3.5 w-3.5 mr-1" />
                      Ative o WhatsApp Business em <span className="font-medium text-brand-600">Configurações → Plano</span> para enviar mensagens.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 mb-4">
              <MessageCircle className="h-8 w-8 text-brand-400" />
            </div>
            <p className="text-base font-semibold text-text-primary mb-1">Selecione um cliente</p>
            <p className="text-sm text-text-tertiary max-w-xs">
              Veja o histórico de mensagens, agendamentos e adicione notas privadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
