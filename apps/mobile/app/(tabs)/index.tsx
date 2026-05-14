import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, TrendingUp, Clock, CheckCircle, ChevronRight } from "lucide-react-native";
import { useVenue } from "@/hooks/use-venue";
import { useAppointments, useTodayStats, type Appointment } from "@/hooks/use-appointments";
import { useAuthStore } from "@/stores/auth-store";
import { useQueryClient } from "@tanstack/react-query";

const BRAND = "#0F766E";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  confirmed:   { label: "Confirmado",   bg: "#e0f2fe", text: "#0369a1" },
  in_progress: { label: "Em andamento", bg: "#fef9c3", text: "#a16207" },
  completed:   { label: "Concluído",    bg: "#dcfce7", text: "#15803d" },
  cancelled:   { label: "Cancelado",    bg: "#fee2e2", text: "#b91c1c" },
  no_show:     { label: "No-show",      bg: "#f1f5f9", text: "#64748b" },
};

// ─── Appointment card ─────────────────────────────────────────────────────────

function AptCard({ apt }: { apt: Appointment }) {
  const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.confirmed;
  const services = apt.appointment_items.map(i => i.description).join(", ");

  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    }}>
      {/* Time column */}
      <View style={{ alignItems: "center", minWidth: 44 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: BRAND }}>
          {fmtTime(apt.scheduled_at)}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ width: 1, height: 40, backgroundColor: "#e2e8f0" }} />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }} numberOfLines={1}>
          {apt.venue_customers?.full_name ?? "Cliente"}
        </Text>
        <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }} numberOfLines={1}>
          {services || "Serviço"}
        </Text>
        {apt.team_members && (
          <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
            {apt.team_members.display_name}
          </Text>
        )}
      </View>

      {/* Status + price */}
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={{ backgroundColor: cfg.bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
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

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: typeof Calendar; color: string;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: color + "20",
        alignItems: "center", justifyContent: "center",
        marginBottom: 8,
      }}>
        <Icon size={16} color={color} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>{value}</Text>
      <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data: venue, isLoading: venueLoading } = useVenue();
  const { data: todayApts = [], isLoading: aptsLoading } = useAppointments(venue?.id, "today");
  const { data: stats } = useTodayStats(venue?.id);

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const isLoading = venueLoading || aptsLoading;

  async function onRefresh() {
    await qc.invalidateQueries({ queryKey: ["venue"] });
    await qc.invalidateQueries({ queryKey: ["appointments"] });
    await qc.invalidateQueries({ queryKey: ["today-stats"] });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={BRAND} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!venue) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 24 }} edges={["top"]}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a", marginTop: 16 }}>
          Olá, {userName.split(" ")[0]}!
        </Text>
        <View style={{
          marginTop: 24, padding: 20, backgroundColor: "#fff",
          borderRadius: 20, alignItems: "center",
        }}>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
            Configure seu estabelecimento no painel web para começar a usar o app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <FlatList
        data={todayApts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={BRAND} />
        }
        ListHeaderComponent={
          <View>
            {/* Greeting */}
            <View style={{ marginTop: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>
                {greeting()}, {userName.split(" ")[0]}! 👋
              </Text>
              <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, textTransform: "capitalize" }}>
                {todayLabel()}
              </Text>
              <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                {venue.name}
              </Text>
            </View>

            {/* KPI row */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              <KpiCard
                label="Hoje"
                value={String(stats?.total ?? 0)}
                icon={Calendar}
                color={BRAND}
              />
              <KpiCard
                label="Pendentes"
                value={String(stats?.pending ?? 0)}
                icon={Clock}
                color="#f59e0b"
              />
              <KpiCard
                label="Faturado"
                value={fmtCurrency(stats?.revenue ?? 0).replace("R$ ", "R$ ")}
                icon={TrendingUp}
                color="#10b981"
              />
            </View>

            {/* Section header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>
                Agenda de hoje
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/bookings")}
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: BRAND }}>Ver tudo</Text>
                <ChevronRight size={14} color={BRAND} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => <AptCard apt={item} />}
        ListEmptyComponent={
          <View style={{
            backgroundColor: "#fff", borderRadius: 20, padding: 32,
            alignItems: "center",
            shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
          }}>
            <View style={{
              width: 52, height: 52, borderRadius: 16, backgroundColor: "#f0fdfa",
              alignItems: "center", justifyContent: "center", marginBottom: 12,
            }}>
              <CheckCircle size={26} color={BRAND} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>
              Nenhum agendamento hoje
            </Text>
            <Text style={{ fontSize: 13, color: "#64748b", marginTop: 6, textAlign: "center" }}>
              Toque no botão{" "}
              <Text style={{ fontWeight: "700", color: BRAND }}>+</Text>
              {" "}para criar um novo agendamento.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
