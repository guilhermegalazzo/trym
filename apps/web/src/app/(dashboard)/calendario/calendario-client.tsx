"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalAppointment, CalTeamMember } from "./page";

// ─── Constants ─────────────────────────────────────────────────────────────────

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 21;
const PIXELS_PER_MINUTE = 1.2; // 1.2px/min → 60min = 72px per hour slot
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const WEEKDAYS_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const WEEKDAYS_LONG  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmed:   { bg: "bg-brand-50",   border: "border-brand-400",   text: "text-brand-800"   },
  in_progress: { bg: "bg-amber-50",   border: "border-amber-400",   text: "text-amber-800"   },
  completed:   { bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-800" },
  no_show:     { bg: "bg-neutral-100",border: "border-neutral-300", text: "text-neutral-500" },
};

const FEMALE_COLORS = { bg: "bg-pink-50", border: "border-pink-400", text: "text-pink-800" };

// Heuristic: Brazilian female names typically end in 'a'
const MALE_NAME_EXCEPTIONS = new Set(["luca","nikita","joshua","andrea","danilo","costa","agatha"]);
function isFemale(name: string): boolean {
  const first = name.trim().split(" ")[0].toLowerCase();
  if (MALE_NAME_EXCEPTIONS.has(first)) return false;
  return first.endsWith("a");
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor);
  const day = start.getDay();
  start.setDate(start.getDate() - day); // Sunday as week start
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function minutesFromMidnight(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function topOffset(startMinutes: number): number {
  return (startMinutes - GRID_START_HOUR * 60) * PIXELS_PER_MINUTE;
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

// ─── Mini calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({
  anchor,
  onSelectDay,
}: {
  anchor: Date;
  onSelectDay: (d: Date) => void;
}) {
  const today = new Date();
  const [current, setCurrent] = useState({ year: anchor.getFullYear(), month: anchor.getMonth() });
  const daysInMonth = getDaysInMonth(current.year, current.month);
  const firstDay = getFirstDayOfMonth(current.year, current.month);

  function prevMonth() {
    setCurrent((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  }
  function nextMonth() {
    setCurrent((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-0 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5 text-text-tertiary" />
        </button>
        <span className="text-xs font-semibold text-text-primary">
          {MONTHS[current.month].slice(0, 3)} {current.year}
        </span>
        <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-surface-2 transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d} className="text-center text-[9px] font-bold text-text-tertiary uppercase">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <span key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const date = new Date(current.year, current.month, day);
          const isToday = isSameDay(date, today);
          const isAnchor = isSameDay(date, anchor);
          return (
            <button
              key={day}
              onClick={() => onSelectDay(date)}
              className={cn(
                "aspect-square flex items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                isAnchor ? "bg-brand-600 text-white font-bold" :
                isToday  ? "text-brand-600 font-bold" :
                           "text-text-secondary hover:bg-surface-2",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Appointment block ─────────────────────────────────────────────────────────

function AptBlock({ apt, overlap = 1, overlapIdx = 0 }: {
  apt: CalAppointment;
  overlap?: number;
  overlapIdx?: number;
}) {
  const startMin  = minutesFromMidnight(apt.scheduled_at);
  const top       = topOffset(startMin);
  const height    = Math.max(apt.duration_minutes * PIXELS_PER_MINUTE, 24);
  const customerName = apt.venue_customers?.full_name ?? "";
  const colors =
    apt.status === "confirmed"
      ? (isFemale(customerName) ? FEMALE_COLORS : STATUS_COLORS.confirmed)
      : (STATUS_COLORS[apt.status] ?? STATUS_COLORS.confirmed);
  const service   = apt.appointment_items[0]?.description ?? "";

  const widthPct  = 100 / overlap;
  const leftPct   = widthPct * overlapIdx;

  return (
    <div
      className={cn(
        "absolute rounded-lg border-l-2 px-2 py-1 overflow-hidden cursor-pointer transition-all hover:z-10 hover:scale-[1.01]",
        colors.bg, colors.border, colors.text,
      )}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      title={`${apt.venue_customers?.full_name ?? "Cliente"} — ${formatTime(apt.scheduled_at)}`}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">
        {apt.venue_customers?.full_name ?? "Cliente"}
      </p>
      {height > 32 && service && (
        <p className="text-[10px] opacity-70 leading-tight truncate">{service}</p>
      )}
      {height > 48 && (
        <p className="text-[10px] opacity-60 font-mono">{formatTime(apt.scheduled_at)}</p>
      )}
    </div>
  );
}

// ─── Day column (timeline grid) ────────────────────────────────────────────────

function DayColumn({ day, appointments, isToday }: {
  day: Date;
  appointments: CalAppointment[];
  isToday: boolean;
}) {
  const totalGridHeight = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT;

  // Simple overlap detection: sort by start, assign columns
  type Slot = { apt: CalAppointment; col: number; cols: number };
  const slots: Slot[] = [];

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  );

  for (const apt of sorted) {
    const startMin = minutesFromMidnight(apt.scheduled_at);
    const endMin   = startMin + apt.duration_minutes;
    let col = 0;
    while (slots.some(
      (s) =>
        s.col === col &&
        minutesFromMidnight(s.apt.scheduled_at) < endMin &&
        minutesFromMidnight(s.apt.scheduled_at) + s.apt.duration_minutes > startMin,
    )) col++;
    slots.push({ apt, col, cols: 1 });
  }

  // Fix cols to max overlap in each group
  for (const slot of slots) {
    const startMin = minutesFromMidnight(slot.apt.scheduled_at);
    const endMin   = startMin + slot.apt.duration_minutes;
    const maxCol   = Math.max(...slots.filter(
      (s) =>
        minutesFromMidnight(s.apt.scheduled_at) < endMin &&
        minutesFromMidnight(s.apt.scheduled_at) + s.apt.duration_minutes > startMin,
    ).map((s) => s.col));
    slot.cols = maxCol + 1;
  }

  return (
    <div
      className={cn("relative border-l border-border-subtle", isToday && "bg-brand-50/30")}
      style={{ height: totalGridHeight }}
    >
      {slots.map(({ apt, col, cols }) => (
        <AptBlock key={apt.id} apt={apt} overlap={cols} overlapIdx={col} />
      ))}
    </div>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

export function CalendarioClient({
  appointments,
  teamMembers,
}: {
  appointments: CalAppointment[];
  teamMembers: CalTeamMember[];
}) {
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState(today);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekDays = getWeekDays(anchorDate);

  const filteredApts = filterMember
    ? appointments.filter((a) => a.team_members?.id === filterMember)
    : appointments;

  function aptsForDay(day: Date): CalAppointment[] {
    return filteredApts.filter((a) => isSameDay(new Date(a.scheduled_at), day));
  }

  function prevWeek() {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - 7);
    setAnchorDate(d);
  }
  function nextWeek() {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() + 7);
    setAnchorDate(d);
  }
  function goToday() {
    setAnchorDate(new Date());
  }

  const hours = Array.from(
    { length: GRID_END_HOUR - GRID_START_HOUR },
    (_, i) => GRID_START_HOUR + i,
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Calendário</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {weekDays[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
            {" – "}
            {weekDays[6].toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="rounded-xl border border-border-default bg-surface-0 px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-all">
            Hoje
          </button>
          <Link
            href="/agendamentos/novo"
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo
          </Link>
          <div className="flex rounded-xl border border-border-default bg-surface-0 overflow-hidden">
            <button onClick={prevWeek} className="px-2.5 py-2 hover:bg-surface-2 transition-colors border-r border-border-subtle">
              <ChevronLeft className="h-4 w-4 text-text-secondary" />
            </button>
            <button onClick={nextWeek} className="px-2.5 py-2 hover:bg-surface-2 transition-colors">
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">

        {/* Sidebar */}
        <div className="space-y-4">
          <MiniCalendar anchor={anchorDate} onSelectDay={setAnchorDate} />

          {/* Team filter */}
          {teamMembers.length > 0 && (
            <div className="rounded-2xl border border-border-subtle bg-surface-0 p-4">
              <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-3">
                Equipe
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => setFilterMember(null)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    !filterMember ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-surface-2",
                  )}
                >
                  Todos
                </button>
                {teamMembers.map((tm) => (
                  <button
                    key={tm.id}
                    onClick={() => setFilterMember(filterMember === tm.id ? null : tm.id)}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors",
                      filterMember === tm.id ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-surface-2",
                    )}
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-white">
                        {tm.display_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="truncate">{tm.display_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {teamMembers.length === 0 && (
            <div className="rounded-2xl border border-border-subtle bg-surface-0 p-4 flex flex-col items-center text-center py-6">
              <CalendarDays className="h-7 w-7 text-text-disabled mb-2" />
              <p className="text-xs text-text-tertiary">Nenhum membro na equipe</p>
            </div>
          )}
        </div>

        {/* Week grid */}
        <div className="rounded-2xl border border-border-subtle bg-surface-0 overflow-hidden">

          {/* Week header row */}
          <div className="grid border-b border-border-subtle" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
            <div />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, today);
              const dayApts = aptsForDay(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setAnchorDate(day)}
                  className={cn(
                    "flex flex-col items-center py-3 border-l border-border-subtle transition-colors hover:bg-surface-1",
                    isToday && "bg-brand-50/60",
                  )}
                >
                  <span className="text-[10px] font-semibold text-text-tertiary uppercase">{WEEKDAYS_LONG[day.getDay()]}</span>
                  <span className={cn(
                    "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold",
                    isToday ? "bg-brand-600 text-white" : "text-text-primary",
                  )}>
                    {day.getDate()}
                  </span>
                  {dayApts.length > 0 && (
                    <span className="mt-0.5 text-[9px] font-semibold text-coral-500 tabular-nums">
                      {dayApts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 600 }}>
            <div className="grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>

              {/* Hour labels */}
              <div>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="flex items-start justify-end pr-2 pt-1"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="text-[10px] font-medium text-text-tertiary font-mono tabular-nums leading-none">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day) => {
                const isToday = isSameDay(day, today);
                const dayApts = aptsForDay(day);
                return (
                  <div key={day.toISOString()} className="relative">
                    {/* Hour grid lines */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="border-t border-border-subtle"
                        style={{ height: HOUR_HEIGHT }}
                      />
                    ))}
                    {/* Appointment blocks */}
                    <div className="absolute inset-0 pt-0">
                      <DayColumn day={day} appointments={dayApts} isToday={isToday} />
                    </div>
                    {/* Today line */}
                    {isToday && (() => {
                      const now = new Date();
                      const nowMin = now.getHours() * 60 + now.getMinutes();
                      if (nowMin < GRID_START_HOUR * 60 || nowMin > GRID_END_HOUR * 60) return null;
                      const top = topOffset(nowMin);
                      return (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-coral-500 z-10 pointer-events-none"
                          style={{ top }}
                        >
                          <div className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-coral-500" />
                        </div>
                      );
                    })()}
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
