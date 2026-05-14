import { useState } from "react";
import {
  View, Text, FlatList, TextInput,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Users, Phone } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useVenue } from "@/hooks/use-venue";
import { useQuery } from "@tanstack/react-query";

const BRAND = "#0F766E";

type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  visit_count: number;
  total_spent_cents: number;
  last_visit_at: string | null;
};

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function CustomerCard({ customer }: { customer: Customer }) {
  const initials = customer.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <View style={{
      backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8,
      flexDirection: "row", alignItems: "center", gap: 12,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: BRAND + "20",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: BRAND }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
          {customer.full_name}
        </Text>
        {customer.phone && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Phone size={11} color="#94a3b8" strokeWidth={1.8} />
            <Text style={{ fontSize: 12, color: "#94a3b8" }}>{customer.phone}</Text>
          </View>
        )}
        <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          Última visita: {fmtDate(customer.last_visit_at)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a" }}>
          {fmtCurrency(customer.total_spent_cents)}
        </Text>
        <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          {customer.visit_count} {customer.visit_count === 1 ? "visita" : "visitas"}
        </Text>
      </View>
    </View>
  );
}

export default function ClientesScreen() {
  const [query, setQuery] = useState("");
  const { data: venue } = useVenue();

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["customers", venue?.id],
    enabled: !!venue,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("venue_customers")
        .select("id, full_name, phone, visit_count, total_spent_cents, last_visit_at")
        .eq("venue_id", venue!.id)
        .order("last_visit_at", { ascending: false, nullsFirst: false })
        .limit(100);
      return (data ?? []) as Customer[];
    },
  });

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(query.toLowerCase()) ||
    (c.phone ?? "").includes(query)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>Clientes</Text>
        <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
          {customers.length} cliente{customers.length !== 1 ? "s" : ""} cadastrados
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, position: "relative" }}>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          backgroundColor: "#fff", borderRadius: 12, borderWidth: 1,
          borderColor: "#e2e8f0", paddingHorizontal: 12, paddingVertical: 10,
        }}>
          <Search size={16} color="#94a3b8" strokeWidth={2} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: "#0f172a" }}
            placeholder="Buscar por nome ou telefone…"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={BRAND} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={BRAND} />
          }
          renderItem={({ item }) => <CustomerCard customer={item} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 48, gap: 10 }}>
              <View style={{
                width: 56, height: 56, borderRadius: 18,
                backgroundColor: "#f0fdfa",
                alignItems: "center", justifyContent: "center",
              }}>
                <Users size={26} color={BRAND} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>
                {query ? "Nenhum resultado" : "Nenhum cliente ainda"}
              </Text>
              <Text style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", maxWidth: 220 }}>
                {query
                  ? "Tente buscar por outro nome ou telefone."
                  : "Clientes aparecem aqui após o primeiro agendamento."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
