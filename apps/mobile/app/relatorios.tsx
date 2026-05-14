import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, TrendingUp, DollarSign, CalendarCheck2, Users, BarChart2 } from "lucide-react-native";
import { useVenue } from "@/hooks/use-venue";
import { useRelatorios } from "@/hooks/use-relatorios";
import type { RelatorioMember, RelatorioService } from "@/hooks/use-relatorios";

const BRAND = "#0F766E";
const SCREEN_W = Dimensions.get("window").width;

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function RevenueBar({ data }: { data: Array<{ date: string; revenue: number }> }) {
  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const barW = Math.max(4, Math.floor((SCREEN_W - 64) / data.length) - 2);
  const showLabel = data.length <= 14;

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 72, gap: 2 }}>
        {data.map((d) => {
          const h = Math.max(4, Math.round((d.revenue / maxVal) * 72));
          return (
            <View
              key={d.date}
              style={{
                width: barW,
                height: h,
                borderRadius: 3,
                backgroundColor: d.revenue > 0 ? BRAND : "#e2e8f0",
              }}
            />
          );
        })}
      </View>
      {showLabel && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontSize: 10, color: "#94a3b8" }}>{fmtDate(data[0].date)}</Text>
          <Text style={{ fontSize: 10, color: "#94a3b8" }}>{fmtDate(data[data.length - 1].date)}</Text>
        </View>
      )}
    </View>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub,
}: {
  icon: typeof DollarSign; label: string; value: string; sub?: string;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: BRAND + "15",
        alignItems: "center", justifyContent: "center",
        marginBottom: 8,
      }}>
        <Icon size={16} color={BRAND} strokeWidth={1.8} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>{value}</Text>
      <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</Text>
      {sub && <Text style={{ fontSize: 10, color: BRAND, fontWeight: "700", marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

// ─── Service row ──────────────────────────────────────────────────────────────

function ServiceRow({ item, maxRevenue }: { item: RelatorioService; maxRevenue: number }) {
  const pct = maxRevenue > 0 ? item.total_cents / maxRevenue : 0;

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", flex: 1 }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a", marginLeft: 8 }}>
          {fmtCurrency(item.total_cents)}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
          <View style={{ width: `${Math.round(pct * 100)}%`, height: "100%", backgroundColor: BRAND, borderRadius: 3 }} />
        </View>
        <Text style={{ fontSize: 11, color: "#94a3b8", width: 36, textAlign: "right" }}>
          {item.count}×
        </Text>
      </View>
    </View>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: RelatorioMember }) {
  const initials = member.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f8fafc",
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: BRAND,
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a" }}>{member.name}</Text>
        <Text style={{ fontSize: 11, color: "#94a3b8" }}>
          {member.count} atendimento{member.count !== 1 ? "s" : ""} · {member.commission_percentage}% comissão
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a" }}>
          {fmtCurrency(member.total_cents)}
        </Text>
        {member.commission_cents > 0 && (
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#f59e0b" }}>
            {fmtCurrency(member.commission_cents)} comissão
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RelatoriosScreen() {
  const router = useRouter();
  const { data: venue } = useVenue();
  const [days, setDays] = useState(30);
  const { data, isLoading } = useRelatorios(venue?.id, days);

  const maxServiceRevenue = Math.max(...(data?.topServices.map((s) => s.total_cents) ?? [1]), 1);
  const totalCommission = (data?.memberStats ?? []).reduce((s, m) => s + m.commission_cents, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
        backgroundColor: "#fff",
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}
          style={{ padding: 4 }}>
          <ArrowLeft size={20} color="#475569" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a", flex: 1 }}>
          Relatórios
        </Text>
        <BarChart2 size={20} color={BRAND} strokeWidth={1.8} />
      </View>

      {/* Period pills */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.days}
            activeOpacity={0.7}
            onPress={() => setDays(p.days)}
            style={{
              paddingHorizontal: 16, paddingVertical: 7,
              borderRadius: 99,
              backgroundColor: days === p.days ? BRAND : "#fff",
              borderWidth: 1,
              borderColor: days === p.days ? BRAND : "#e2e8f0",
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: "700",
              color: days === p.days ? "#fff" : "#64748b",
            }}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading || !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={BRAND} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* KPI grid */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <KpiCard
              icon={DollarSign}
              label="Faturamento"
              value={fmtCurrency(data.stats.revenue)}
            />
            <KpiCard
              icon={CalendarCheck2}
              label="Agendamentos"
              value={String(data.stats.appointments)}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <KpiCard
              icon={TrendingUp}
              label="Ticket médio"
              value={fmtCurrency(data.stats.avgTicket)}
            />
            <KpiCard
              icon={Users}
              label="Novos clientes"
              value={String(data.stats.newClients)}
              sub={`${data.stats.completionRate}% conclusão`}
            />
          </View>

          {/* Revenue chart */}
          <View style={{
            backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16,
            shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
          }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#94a3b8", marginBottom: 2 }}>
              FATURAMENTO DIÁRIO
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>
              {fmtCurrency(data.stats.revenue)}
            </Text>
            <RevenueBar data={data.dailyRevenue} />
          </View>

          {/* Top services */}
          {data.topServices.length > 0 && (
            <View style={{
              backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16,
              shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
            }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#94a3b8", marginBottom: 12 }}>
                TOP SERVIÇOS
              </Text>
              {data.topServices.map((s) => (
                <ServiceRow key={s.name} item={s} maxRevenue={maxServiceRevenue} />
              ))}
            </View>
          )}

          {/* Team members */}
          {data.memberStats.length > 0 && (
            <View style={{
              backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16,
              shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
            }}>
              <View style={{
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#94a3b8" }}>
                  PROFISSIONAIS
                </Text>
                {totalCommission > 0 && (
                  <View style={{
                    backgroundColor: "#fef3c7", borderRadius: 99,
                    paddingHorizontal: 10, paddingVertical: 3,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#d97706" }}>
                      {fmtCurrency(totalCommission)} em comissões
                    </Text>
                  </View>
                )}
              </View>
              {data.memberStats.map((m) => (
                <MemberRow key={m.name} member={m} />
              ))}
            </View>
          )}

          {data.topServices.length === 0 && data.memberStats.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <BarChart2 size={40} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", marginTop: 12 }}>
                Sem dados no período
              </Text>
              <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, textAlign: "center" }}>
                Complete atendimentos para ver os relatórios
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
