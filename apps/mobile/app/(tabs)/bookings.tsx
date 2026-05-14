import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarCheck2 } from "lucide-react-native";
import { useVenue } from "@/hooks/use-venue";
import { useAppointments, type Appointment, type AppointmentFilter } from "@/hooks/use-appointments";
import { useQueryClient } from "@tanstack/react-query";

const BRAND = "#0F766E";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje, ${time}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + ` ${time}`;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  confirmed:   { label: "Confirmado",   bg: "#e0f2fe", text: "#0369a1" },
  in_progress: { label: "Em andamento", bg: "#fef9c3", text: "#a16207" },
  completed:   { label: "Concluído",    bg: "#dcfce7", text: "#15803d" },
  cancelled:   { label: "Cancelado",    bg: "#fee2e2", text: "#b91c1c" },
  no_show:     { label: "No-show",      bg: "#f1f5f9", text: "#64748b" },
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: Array<{ key: AppointmentFilter; label: string }> = [
  { key: "today",     label: "Hoje"      },
  { key: "upcoming",  label: "Próximos"  },
  { key: "completed", label: "Concluídos"},
  { key: "cancelled", label: "Cancelados"},
];

// ─── Appointment row ──────────────────────────────────────────────────────────

function AptRow({ apt }: { apt: Appointment }) {
  const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.confirmed;
  const services = apt.appointment_items.map(i => i.description).join(", ");
  const initials = (apt.venue_customers?.full_name ?? "?")
    .split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 14,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    }}>
      {/* Avatar */}
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: BRAND + "20",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: BRAND }}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }} numberOfLines={1}>
          {apt.venue_customers?.full_name ?? "Cliente"}
        </Text>
        <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }} numberOfLines={1}>
          {services || "Serviço"}
        </Text>
        <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          {fmtDateTime(apt.scheduled_at)}
          {apt.team_members ? ` · ${apt.team_members.display_name}` : ""}
        </Text>
      </View>

      {/* Right */}
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={{
          backgroundColor: cfg.bg, borderRadius: 99,
          paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: cfg.text }}>{cfg.label}</Text>
        </View>
        {apt.total_cents > 0 && (
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#0f172a" }}>
            {fmtCurrency(apt.total_cents)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── BookingsScreen ───────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<AppointmentFilter>("today");
  const { data: venue } = useVenue();
  const { data: apts = [], isLoading } = useAppointments(venue?.id, activeTab);
  const qc = useQueryClient();

  async function onRefresh() {
    await qc.invalidateQueries({ queryKey: ["appointments", venue?.id, activeTab] });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>Agendamentos</Text>
        <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
          {apts.length} {apts.length === 1 ? "agendamento" : "agendamentos"}
        </Text>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8,
        gap: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 99,
                backgroundColor: active ? BRAND : "#f1f5f9",
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 12, fontWeight: "700",
                color: active ? "#fff" : "#64748b",
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={BRAND} />
        </View>
      ) : (
        <FlatList
          data={apts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={BRAND} />
          }
          renderItem={({ item }) => <AptRow apt={item} />}
          ListEmptyComponent={
            <View style={{
              flex: 1, alignItems: "center", justifyContent: "center",
              paddingTop: 60, gap: 12,
            }}>
              <View style={{
                width: 56, height: 56, borderRadius: 18,
                backgroundColor: "#f0fdfa",
                alignItems: "center", justifyContent: "center",
              }}>
                <CalendarCheck2 size={28} color={BRAND} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>
                Nenhum agendamento
              </Text>
              <Text style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", maxWidth: 240 }}>
                {activeTab === "today"
                  ? "Sem agendamentos para hoje."
                  : activeTab === "upcoming"
                    ? "Nenhum agendamento futuro."
                    : "Nenhum registro encontrado."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
