"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  MapPin, Clock, ChevronRight, ChevronLeft, Check,
  User, Calendar, Scissors, CheckCircle2, Loader2, CalendarPlus,
} from "lucide-react";
import { submitBooking } from "./actions";
import type { BookingVenue, BookingService, BookingTeamMember, BookingHours } from "./page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function parseMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function fmtDateDisplay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay();
}

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { icon: Scissors, label: "Serviço" },
  { icon: User,     label: "Profissional" },
  { icon: Calendar, label: "Horário" },
  { icon: Check,    label: "Confirmar" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map(({ icon: Icon, label }, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
              done   ? "border-brand-600 bg-brand-600 text-white"
                     : active ? "border-brand-600 bg-white text-brand-600"
                     : "border-border-default bg-white text-text-tertiary",
            )}>
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span className={cn("text-[10px] font-medium hidden sm:block",
              active || done ? "text-brand-700" : "text-text-tertiary")}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "absolute h-0.5 transition-all",
                "hidden", // connector via CSS is complex, skip for simplicity
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Service selection ────────────────────────────────────────────────

function ServiceStep({
  services,
  selected,
  onToggle,
}: {
  services: BookingService[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Escolha o serviço</h2>
        <p className="text-sm text-text-tertiary mt-0.5">Você pode selecionar mais de um.</p>
      </div>
      {services.length === 0 ? (
        <p className="text-sm text-text-tertiary py-8 text-center">Nenhum serviço disponível no momento.</p>
      ) : (
        <div className="space-y-2">
          {services.map(s => {
            const isSelected = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onToggle(s.id)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-brand-500 bg-brand-50"
                    : "border-border-subtle bg-white hover:border-brand-300 hover:bg-surface-1",
                )}
              >
                <div className={cn(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isSelected ? "border-brand-600 bg-brand-600" : "border-border-default",
                )}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{s.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-text-primary">{fmtPrice(s.price_cents)}</p>
                  <p className="text-[11px] text-text-tertiary">{fmtDuration(s.duration_minutes)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Team member ──────────────────────────────────────────────────────

function TeamStep({
  team,
  selectedId,
  onSelect,
}: {
  team: BookingTeamMember[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Escolha o profissional</h2>
        <p className="text-sm text-text-tertiary mt-0.5">Sem preferência? Escolha &ldquo;Qualquer profissional&rdquo;.</p>
      </div>
      <div className="space-y-2">
        {/* "Any" option */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
            selectedId === null
              ? "border-brand-500 bg-brand-50"
              : "border-border-subtle bg-white hover:border-brand-300 hover:bg-surface-1",
          )}
        >
          <div className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
            selectedId === null ? "bg-brand-100" : "bg-surface-2",
          )}>
            <User className={cn("h-5 w-5", selectedId === null ? "text-brand-600" : "text-text-tertiary")} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Qualquer profissional</p>
            <p className="text-xs text-text-tertiary">Primeiro disponível no horário escolhido</p>
          </div>
          {selectedId === null && (
            <Check className="ml-auto h-4 w-4 text-brand-600 flex-shrink-0" />
          )}
        </button>

        {team.map(m => {
          const isSelected = selectedId === m.id;
          const initials = m.display_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-brand-500 bg-brand-50"
                  : "border-border-subtle bg-white hover:border-brand-300 hover:bg-surface-1",
              )}
            >
              <div className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                "bg-gradient-to-br from-brand-400 to-brand-600",
              )}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{m.display_name}</p>
                {m.role && <p className="text-xs text-text-tertiary">{m.role}</p>}
              </div>
              {isSelected && <Check className="ml-auto h-4 w-4 text-brand-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Date & time ──────────────────────────────────────────────────────

function DateTimeStep({
  venueId,
  businessHours,
  totalDuration,
  teamMemberId,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
}: {
  venueId: string;
  businessHours: BookingHours[];
  totalDuration: number;
  teamMemberId: string | null;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedSlot: string;
  setSelectedSlot: (s: string) => void;
}) {
  const supabase = createClient();
  const [calYear, setCalYear]   = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [busySlots, setBusySlots] = useState<{ start: string; duration: number }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch existing appointments for selected date
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    const dayStart = `${selectedDate}T00:00:00`;
    const dayEnd   = `${selectedDate}T23:59:59`;

    let q = supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .eq("venue_id", venueId)
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .in("status", ["confirmed", "in_progress"]);

    if (teamMemberId) q = q.eq("team_member_id", teamMemberId);

    q.then(({ data }) => {
      setBusySlots((data ?? []).map(a => ({
        start: a.scheduled_at.substring(11, 16),
        duration: (a as { scheduled_at: string; duration_minutes?: number }).duration_minutes ?? 60,
      })));
      setLoadingSlots(false);
    });
  }, [selectedDate, teamMemberId, venueId]);

  // Generate calendar days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  function isDateSelectable(y: number, mo: number, d: number): boolean {
    const dt = new Date(y, mo, d);
    if (dt < today) return false;
    const dow = dt.getDay();
    const bh = businessHours.find(h => h.day_of_week === dow);
    return !bh?.is_closed && !!bh;
  }

  function selectDate(y: number, mo: number, d: number) {
    if (!isDateSelectable(y, mo, d)) return;
    const mm = String(mo + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const newDate = `${y}-${mm}-${dd}`;
    setSelectedDate(newDate);
    setSelectedSlot("");
  }

  // Generate time slots for selected date
  function getSlots(): string[] {
    if (!selectedDate) return [];
    const dow = getDayOfWeek(selectedDate);
    const bh = businessHours.find(h => h.day_of_week === dow);
    if (!bh || bh.is_closed || !bh.open_time || !bh.close_time) return [];

    const openMin  = parseMins(bh.open_time);
    const closeMin = parseMins(bh.close_time);
    const lastSlot = closeMin - Math.max(totalDuration, 30);
    const slots: string[] = [];
    for (let m = openMin; m <= lastSlot; m += 30) {
      slots.push(minsToTime(m));
    }
    return slots;
  }

  function isSlotBusy(slot: string): boolean {
    const slotMin = parseMins(slot);
    const slotEnd = slotMin + totalDuration;
    return busySlots.some(({ start, duration }) => {
      const bMin = parseMins(start);
      const bEnd = bMin + duration;
      return bMin < slotEnd && bEnd > slotMin;
    });
  }

  const slots = getSlots();

  const isToday = (d: number) => {
    const dt = new Date(calYear, calMonth, d);
    return dt.toDateString() === today.toDateString();
  };

  const isSelected = (d: number) => {
    const mm = String(calMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return selectedDate === `${calYear}-${mm}-${dd}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Escolha o horário</h2>
        <p className="text-sm text-text-tertiary mt-0.5">Duração total: {fmtDuration(totalDuration)}</p>
      </div>

      {/* Mini calendar */}
      <div className="rounded-xl border border-border-subtle bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); }}
            className="rounded-lg p-1.5 hover:bg-surface-1"
          >
            <ChevronLeft className="h-4 w-4 text-text-secondary" />
          </button>
          <span className="text-sm font-semibold text-text-primary">
            {MONTHS[calMonth]} {calYear}
          </span>
          <button
            onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); }}
            className="rounded-lg p-1.5 hover:bg-surface-1"
          >
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-text-tertiary py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const selectable = isDateSelectable(calYear, calMonth, d);
            const selected = isSelected(d);
            return (
              <button
                key={d}
                disabled={!selectable}
                onClick={() => selectDate(calYear, calMonth, d)}
                className={cn(
                  "flex h-8 w-full items-center justify-center rounded-lg text-sm transition-all",
                  selected ? "bg-brand-600 text-white font-bold"
                    : selectable
                      ? isToday(d)
                        ? "border border-brand-400 text-brand-600 font-semibold hover:bg-brand-50"
                        : "text-text-primary hover:bg-surface-1 font-medium"
                      : "text-text-tertiary cursor-not-allowed opacity-40",
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-sm font-semibold text-text-primary mb-2">
            {fmtDateDisplay(selectedDate)}
          </p>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">Sem horários disponíveis neste dia.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => {
                const busy = isSlotBusy(slot);
                const isSlotSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    disabled={busy}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "rounded-lg border py-2 text-sm font-medium transition-all",
                      isSlotSelected ? "border-brand-600 bg-brand-600 text-white"
                        : busy ? "border-border-subtle bg-surface-1 text-text-tertiary cursor-not-allowed line-through opacity-50"
                        : "border-border-default bg-white text-text-primary hover:border-brand-400 hover:bg-brand-50",
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Contact + confirm ────────────────────────────────────────────────

function ConfirmStep({
  selectedServices,
  teamMember,
  selectedDate,
  selectedSlot,
  totalCents,
  totalDuration,
  name, setName,
  phone, setPhone,
  email, setEmail,
}: {
  selectedServices: BookingService[];
  teamMember: BookingTeamMember | null;
  selectedDate: string;
  selectedSlot: string;
  totalCents: number;
  totalDuration: number;
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Confirme seu agendamento</h2>
        <p className="text-sm text-text-tertiary mt-0.5">Preencha seus dados para finalizar.</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 space-y-3">
        <div className="space-y-1.5">
          {selectedServices.map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-sm text-text-primary">{s.name}</span>
              <span className="text-sm font-semibold text-text-primary">{fmtPrice(s.price_cents)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border-subtle pt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Total</span>
          <span className="text-base font-bold text-brand-600">{fmtPrice(totalCents)}</span>
        </div>
        <div className="border-t border-border-subtle pt-2 space-y-1 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-brand-500" />
            <span>{fmtDateDisplay(selectedDate)} às {selectedSlot}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            <span>{fmtDuration(totalDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-brand-500" />
            <span>{teamMember ? teamMember.display_name : "Qualquer profissional"}</span>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">Nome completo *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">Telefone / WhatsApp *</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+55 11 99999-9999"
            className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>
    </div>
  );
}

// ─── ICS generator ────────────────────────────────────────────────────────────

function generateICS(params: {
  venueName: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  dateStr: string;   // YYYY-MM-DD
  timeStr: string;   // HH:MM
  durationMinutes: number;
}): string {
  const { venueName, addressLine, city, phone, dateStr, timeStr, durationMinutes } = params;
  const [h, m] = timeStr.split(":").map(Number);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDt = (date: string, hour: number, min: number) =>
    `${date.replace(/-/g, "")}T${pad(hour)}${pad(min)}00`;

  const startDt  = fmtDt(dateStr, h, m);
  const endH     = Math.floor((h * 60 + m + durationMinutes) / 60);
  const endM     = (h * 60 + m + durationMinutes) % 60;
  const endDt    = fmtDt(dateStr, endH, endM);
  const uid      = `${dateStr}-${timeStr.replace(":", "")}-${Date.now()}@trym.app`;
  const location = [addressLine, city].filter(Boolean).join(", ");
  const desc     = phone ? `Dúvidas? Entre em contato: ${phone}` : "Agendamento via Trym";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trym//Trym Agendamentos//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${startDt}`,
    `DTEND:${endDt}`,
    `SUMMARY:Agendamento – ${venueName}`,
    location ? `LOCATION:${location}` : "",
    `DESCRIPTION:${desc}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: você tem um agendamento amanhã!",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Seu agendamento começa em 1 hora!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function downloadICS(ics: string, filename: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ venue, selectedDate, selectedSlot, totalDuration }: {
  venue: BookingVenue;
  selectedDate: string;
  selectedSlot: string;
  totalDuration: number;
}) {
  function handleSaveCalendar() {
    const ics = generateICS({
      venueName:    venue.name,
      addressLine:  venue.address_line ?? null,
      city:         venue.city ?? null,
      phone:        venue.phone ?? null,
      dateStr:      selectedDate,
      timeStr:      selectedSlot,
      durationMinutes: totalDuration,
    });
    downloadICS(ics, `agendamento-${venue.name.toLowerCase().replace(/\s+/g, "-")}.ics`);
  }

  function handleWhatsAppShare() {
    const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long",
    });
    const loc = [venue.address_line, venue.city].filter(Boolean).join(", ");
    const text = encodeURIComponent(
      `📅 Meu agendamento está confirmado!\n\n` +
      `🏢 ${venue.name}\n` +
      `📆 ${dateLabel} às ${selectedSlot}\n` +
      (loc ? `📍 ${loc}\n` : "") +
      (venue.phone ? `📞 ${venue.phone}\n` : "") +
      `\nAgendado pelo Trym ✅`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="flex flex-col items-center text-center py-6 space-y-5 animate-fade-up">
      {/* Check icon */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "rgba(127,209,193,0.15)", boxShadow: "0 0 0 8px rgba(127,209,193,0.08)" }}
      >
        <CheckCircle2 className="h-10 w-10 text-brand-500" strokeWidth={1.5} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-text-primary" style={{ letterSpacing: "-0.02em" }}>
          Agendamento confirmado!
        </h2>
        <p className="text-sm text-text-tertiary mt-1 max-w-xs">
          Você tem um horário em <strong className="text-text-primary">{venue.name}</strong> para{" "}
          {fmtDateDisplay(selectedDate)} às {selectedSlot}.
        </p>
      </div>

      {/* Venue info card */}
      <div
        className="text-left w-full max-w-xs px-5 py-4 space-y-1.5 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-2">LOCAL</p>
        <p className="text-sm font-semibold text-text-primary">{venue.name}</p>
        {venue.address_line && (
          <p className="text-xs text-text-secondary flex items-center gap-1.5">
            <MapPin className="h-3 w-3 flex-shrink-0 text-brand-500" strokeWidth={1.5} />
            {venue.address_line}{venue.city && `, ${venue.city}`}
          </p>
        )}
        {venue.phone && (
          <p className="text-xs text-text-secondary flex items-center gap-1.5">
            <span className="h-3 w-3 flex-shrink-0 text-brand-500 text-center leading-none">☎</span>
            {venue.phone}
          </p>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="w-full max-w-xs space-y-2.5">
        {/* Save to calendar — primary */}
        <button
          onClick={handleSaveCalendar}
          className="group liquid-glass flex w-full items-center gap-3 px-5 py-4 text-left"
          style={{ color: "rgba(255,255,255,0.95)" }}
        >
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <CalendarPlus className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Salvar no Calendário</p>
            <p className="text-xs opacity-75 mt-0.5 leading-tight">
              Receba lembretes no iPhone e Android
            </p>
          </div>
          <ChevronRight className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
        </button>

        {/* Share via WhatsApp — secondary */}
        <button
          onClick={handleWhatsAppShare}
          className="group flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "rgba(37,211,102,0.08)",
            border: "1px solid rgba(37,211,102,0.20)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(37,211,102,0.15)" }}>
            <svg className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-tight">Compartilhar via WhatsApp</p>
            <p className="text-xs text-text-tertiary mt-0.5 leading-tight">
              Envie o resumo do agendamento
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-text-secondary transition-colors" strokeWidth={1.5} />
        </button>
      </div>

      <p className="text-xs text-text-tertiary max-w-xs">
        Em caso de dúvidas, entre em contato direto com o estabelecimento.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  venue: BookingVenue;
  services: BookingService[];
  teamMembers: BookingTeamMember[];
  businessHours: BookingHours[];
}

export function BookingClient({ venue, services, teamMembers, businessHours }: Props) {
  const [step, setStep]               = useState(0);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState("");
  const [pending, startTransition]    = useTransition();

  // Step 1 state
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Step 2 state
  const [teamMemberId, setTeamMemberId] = useState<string | null>(null);

  // Step 3 state
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState("");

  // Step 4 state
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id));
  const totalCents    = selectedServiceObjects.reduce((sum, s) => sum + s.price_cents, 0);
  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration_minutes, 0) || 60;
  const selectedTeamMember = teamMembers.find(m => m.id === teamMemberId) ?? null;

  function toggleService(id: string) {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return selectedServices.length > 0;
      case 1: return true; // team member is optional
      case 2: return !!selectedDate && !!selectedSlot;
      case 3: return !!name.trim() && !!phone.trim();
      default: return false;
    }
  }

  function handleNext() {
    if (!canProceed()) return;
    if (step < 3) { setStep(s => s + 1); return; }
    // Submit
    const scheduledAt = `${selectedDate}T${selectedSlot}:00`;
    setError("");
    startTransition(async () => {
      const result = await submitBooking({
        venueId: venue.id,
        teamMemberId,
        scheduledAt,
        durationMinutes: totalDuration,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        services: selectedServiceObjects.map(s => ({
          serviceId: s.id,
          description: s.name,
          priceCents: s.price_cents,
        })),
        totalCents,
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      // Try Mercado Pago checkout if configured
      if (result.appointmentId && totalCents > 0) {
        try {
          const res = await fetch("/api/mp/create-preference", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointmentId: result.appointmentId,
              venueId: venue.id,
              items: selectedServiceObjects.map(s => ({
                title: s.name,
                quantity: 1,
                unit_price: s.price_cents / 100,
              })),
              payer: { name, email, phone },
            }),
          });
          const json = await res.json() as { checkoutUrl?: string };
          if (json.checkoutUrl) {
            window.location.href = json.checkoutUrl;
            return;
          }
        } catch {
          // MP not configured — fall through to success screen
        }
      }

      setDone(true);
    });
  }

  if (done) {
    return (
      <SuccessScreen
        venue={venue}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        totalDuration={totalDuration}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Venue header */}
      <div className="rounded-2xl bg-white shadow-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{venue.name}</h1>
            {(venue.city || venue.address_line) && (
              <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {[venue.address_line, venue.city, venue.state].filter(Boolean).join(", ")}
              </p>
            )}
            {venue.description && (
              <p className="text-xs text-text-tertiary mt-1.5 line-clamp-2">{venue.description}</p>
            )}
          </div>
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white text-lg font-bold">
            {venue.name[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Wizard card */}
      <div className="rounded-2xl bg-white shadow-card p-6">
        <StepBar current={step} />

        {step === 0 && (
          <ServiceStep
            services={services}
            selected={selectedServices}
            onToggle={toggleService}
          />
        )}
        {step === 1 && (
          <TeamStep
            team={teamMembers}
            selectedId={teamMemberId}
            onSelect={setTeamMemberId}
          />
        )}
        {step === 2 && (
          <DateTimeStep
            venueId={venue.id}
            businessHours={businessHours}
            totalDuration={totalDuration}
            teamMemberId={teamMemberId}
            selectedDate={selectedDate}
            setSelectedDate={d => { setSelectedDate(d); setSelectedSlot(""); }}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
          />
        )}
        {step === 3 && (
          <ConfirmStep
            selectedServices={selectedServiceObjects}
            teamMember={selectedTeamMember}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            totalCents={totalCents}
            totalDuration={totalDuration}
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            email={email} setEmail={setEmail}
          />
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-border-subtle">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={pending}
              className="flex items-center gap-2 rounded-lg border border-border-default px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-1 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando…</>
            ) : step === 3 ? (
              <><Check className="h-4 w-4" /> Confirmar agendamento</>
            ) : (
              <>Continuar <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
