import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User, Building2, MapPin, Phone, LogOut,
  ChevronRight, Settings, BarChart2,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import { useVenue } from "@/hooks/use-venue";
import { useAppointments, useTodayStats } from "@/hooks/use-appointments";
import { supabase } from "@/lib/supabase";

const BRAND = "#0F766E";

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function InfoRow({ icon: Icon, label, value }: {
  icon: typeof User; label: string; value: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: BRAND + "15",
        alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={16} color={BRAND} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>{label}</Text>
        <Text style={{ fontSize: 14, color: "#0f172a", fontWeight: "600", marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function MenuRow({ icon: Icon, label, onPress, danger }: {
  icon: typeof User; label: string; onPress: () => void; danger?: boolean;
}) {
  const color = danger ? "#ef4444" : "#475569";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
      }}
    >
      <Icon size={18} color={color} strokeWidth={1.8} />
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color }}>{label}</Text>
      {!danger && <ChevronRight size={16} color="#cbd5e1" strokeWidth={1.8} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { data: venue } = useVenue();
  const { data: allCompleted = [] } = useAppointments(venue?.id, "completed");
  const { data: stats } = useTodayStats(venue?.id);

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const initials = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const totalRevenue = allCompleted.reduce((sum, a) => sum + a.total_cents, 0);

  async function handleSignOut() {
    Alert.alert("Sair", "Tem certeza que deseja sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>Perfil</Text>
        </View>

        {/* Avatar + name */}
        <View style={{ alignItems: "center", paddingBottom: 24 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            alignItems: "center", justifyContent: "center",
            marginBottom: 12,
            backgroundColor: BRAND,
          }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff" }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
            {userName.split(" ").slice(0, 2).join(" ")}
          </Text>
          <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{user?.email}</Text>
          {venue && (
            <View style={{
              marginTop: 8, flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: BRAND + "15", borderRadius: 99,
              paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Building2 size={12} color={BRAND} strokeWidth={2} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: BRAND }}>{venue.name}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={{
          flexDirection: "row", marginHorizontal: 16, marginBottom: 16, gap: 10,
        }}>
          {[
            { label: "Hoje", value: String(stats?.total ?? 0) },
            { label: "Concluídos", value: String(allCompleted.length) },
            { label: "Faturado", value: fmtCurrency(totalRevenue) },
          ].map(({ label, value }) => (
            <View key={label} style={{
              flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 12,
              alignItems: "center",
              shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
            }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>{value}</Text>
              <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Venue info */}
        {venue && (
          <View style={{
            backgroundColor: "#fff", borderRadius: 20, marginHorizontal: 16,
            marginBottom: 16, padding: 16,
            shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
          }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#94a3b8", marginBottom: 4 }}>
              ESTABELECIMENTO
            </Text>
            <View style={{ gap: 0 }}>
              <InfoRow icon={Building2} label="Nome" value={venue.name} />
              {venue.phone && (
                <View style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                  <InfoRow icon={Phone} label="Telefone" value={venue.phone} />
                </View>
              )}
              {(venue.city || venue.address_line) && (
                <View style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                  <InfoRow
                    icon={MapPin}
                    label="Localização"
                    value={[venue.address_line, venue.city, venue.state].filter(Boolean).join(", ")}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={{
          backgroundColor: "#fff", borderRadius: 20, marginHorizontal: 16,
          overflow: "hidden",
          shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
        }}>
          <MenuRow
            icon={Settings}
            label="Configurações"
            onPress={() =>
              Alert.alert(
                "Configurações",
                "Acesse o painel web em trym.app/configuracoes para ajustar notificações, segurança e dados do estabelecimento.",
                [{ text: "OK" }],
              )
            }
          />
          <MenuRow
            icon={BarChart2}
            label="Relatórios"
            onPress={() => router.push("/relatorios")}
          />
          <MenuRow
            icon={LogOut}
            label="Sair da conta"
            onPress={handleSignOut}
            danger
          />
        </View>

        {/* Version */}
        <Text style={{
          textAlign: "center", fontSize: 11, color: "#cbd5e1",
          marginTop: 24,
        }}>
          Trym v1.0.0 · Painel do gestor
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
