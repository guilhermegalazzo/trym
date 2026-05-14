import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Search, User, Scissors, Clock, CheckCircle } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useVenue } from "@/hooks/use-venue";
import { useQueryClient } from "@tanstack/react-query";

const BRAND = "#0F766E";

// ─── Types ────────────────────────────────────────────────────────────────────

type Customer = { id: string; full_name: string; phone: string | null };
type Service  = { id: string; name: string; duration_minutes: number; price_cents: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayStr(): string {
  return new Date().toISOString().substring(0, 10);
}

function nextHalfHour(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() >= 30 ? 60 : 30, 0, 0);
  return d.toTimeString().substring(0, 5);
}

const INPUT_STYLE = {
  backgroundColor: "#fff",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#e2e8f0",
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  color: "#0f172a",
} as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

// ─── NewBookingScreen ─────────────────────────────────────────────────────────

export default function NewBookingScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: venue } = useVenue();

  const [customerSearch, setCustomerSearch]     = useState("");
  const [customers, setCustomers]               = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName]   = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [services, setServices]             = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [servicesLoaded, setServicesLoaded]   = useState(false);

  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nextHalfHour());
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const searchCustomers = useCallback(async (q: string) => {
    if (!venue || q.length < 2) { setCustomers([]); return; }
    setSearchingCustomer(true);
    const { data } = await supabase
      .from("venue_customers")
      .select("id, full_name, phone")
      .eq("venue_id", venue.id)
      .ilike("full_name", `%${q}%`)
      .limit(8);
    setCustomers((data ?? []) as Customer[]);
    setSearchingCustomer(false);
  }, [venue]);

  async function loadServices() {
    if (!venue || servicesLoaded) return;
    const { data } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price_cents")
      .eq("venue_id", venue.id)
      .eq("is_active", true)
      .order("display_order");
    setServices((data ?? []) as Service[]);
    setServicesLoaded(true);
  }

  async function handleSubmit() {
    if (!venue) return;
    if (!selectedCustomer && !newCustomerName.trim()) {
      Alert.alert("Atenção", "Selecione ou informe o nome do cliente.");
      return;
    }
    if (!selectedService) {
      Alert.alert("Atenção", "Selecione o serviço.");
      return;
    }
    setSaving(true);

    let customerId = selectedCustomer?.id;
    if (!customerId && newCustomerName.trim()) {
      const { data: nc } = await supabase
        .from("venue_customers")
        .insert({
          venue_id: venue.id,
          full_name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
        })
        .select("id")
        .single();
      customerId = nc?.id;
    }

    if (!customerId) {
      Alert.alert("Erro", "Não foi possível identificar o cliente.");
      setSaving(false);
      return;
    }

    const { data: apt, error } = await supabase
      .from("appointments")
      .insert({
        venue_id: venue.id,
        venue_customer_id: customerId,
        scheduled_at: `${date}T${time}:00`,
        status: "confirmed",
        total_cents: selectedService.price_cents,
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (!error && apt) {
      await supabase.from("appointment_items").insert({
        appointment_id: apt.id,
        service_id: selectedService.id,
        description: selectedService.name,
        quantity: 1,
        unit_price_cents: selectedService.price_cents,
        total_cents: selectedService.price_cents,
        display_order: 0,
      });
    }

    setSaving(false);
    if (error) { Alert.alert("Erro", "Não foi possível criar o agendamento."); return; }

    await qc.invalidateQueries({ queryKey: ["appointments"] });
    await qc.invalidateQueries({ queryKey: ["today-stats"] });
    setDone(true);
  }

  // ── Tela de sucesso ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 28,
            backgroundColor: "#dcfce7",
            alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <CheckCircle size={40} color="#15803d" strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a", textAlign: "center" }}>
            Agendamento criado!
          </Text>
          <Text style={{
            fontSize: 14, color: "#64748b", textAlign: "center",
            marginTop: 8, lineHeight: 20,
          }}>
            {selectedCustomer?.full_name ?? newCustomerName} · {selectedService?.name}{"\n"}
            {date} às {time}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{
              marginTop: 28, backgroundColor: BRAND,
              borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Voltar ao início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
          backgroundColor: "#fff",
        }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>Novo agendamento</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={20} color="#94a3b8" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

          {/* ── Cliente ── */}
          <View style={{ marginBottom: 18 }}>
            <SectionLabel>CLIENTE</SectionLabel>
            {!selectedCustomer ? (
              <>
                <View style={{ position: "relative" }}>
                  <TextInput
                    style={{ ...INPUT_STYLE, paddingLeft: 42 }}
                    placeholder="Buscar cliente cadastrado…"
                    placeholderTextColor="#94a3b8"
                    value={customerSearch}
                    onChangeText={q => { setCustomerSearch(q); searchCustomers(q); }}
                  />
                  <View style={{ position: "absolute", left: 13, top: 13 }}>
                    <Search size={16} color="#94a3b8" strokeWidth={2} />
                  </View>
                  {searchingCustomer && (
                    <View style={{ position: "absolute", right: 13, top: 13 }}>
                      <ActivityIndicator size="small" color={BRAND} />
                    </View>
                  )}
                </View>

                {customers.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => { setSelectedCustomer(c); setCustomerSearch(""); setCustomers([]); }}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 10,
                      backgroundColor: "#fff", borderRadius: 10, padding: 12, marginTop: 6,
                      borderWidth: 1, borderColor: "#e2e8f0",
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: BRAND + "20", alignItems: "center", justifyContent: "center",
                    }}>
                      <User size={14} color={BRAND} strokeWidth={1.8} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>{c.full_name}</Text>
                      {c.phone && <Text style={{ fontSize: 12, color: "#94a3b8" }}>{c.phone}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}

                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Ou cadastre novo:</Text>
                  <TextInput
                    style={{ ...INPUT_STYLE, marginBottom: 8 }}
                    placeholder="Nome completo *"
                    placeholderTextColor="#94a3b8"
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                  />
                  <TextInput
                    style={INPUT_STYLE}
                    placeholder="Telefone"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={newCustomerPhone}
                    onChangeText={setNewCustomerPhone}
                  />
                </View>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => setSelectedCustomer(null)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  backgroundColor: BRAND + "15", borderRadius: 12, padding: 12,
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: BRAND, alignItems: "center", justifyContent: "center",
                }}>
                  <User size={16} color="#fff" strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: BRAND }}>
                    {selectedCustomer.full_name}
                  </Text>
                  {selectedCustomer.phone && (
                    <Text style={{ fontSize: 12, color: BRAND + "99" }}>{selectedCustomer.phone}</Text>
                  )}
                </View>
                <X size={16} color={BRAND} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Serviço ── */}
          <View style={{ marginBottom: 18 }}>
            <SectionLabel>SERVIÇO</SectionLabel>
            {!servicesLoaded ? (
              <TouchableOpacity
                onPress={loadServices}
                style={{
                  ...INPUT_STYLE, flexDirection: "row",
                  alignItems: "center", justifyContent: "center", gap: 8,
                }}
                activeOpacity={0.8}
              >
                <Scissors size={16} color="#94a3b8" strokeWidth={1.8} />
                <Text style={{ color: "#94a3b8", fontSize: 14 }}>Carregar serviços</Text>
              </TouchableOpacity>
            ) : !selectedService ? (
              <View style={{ gap: 6 }}>
                {services.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setSelectedService(s)}
                    style={{
                      ...INPUT_STYLE, flexDirection: "row",
                      alignItems: "center", justifyContent: "space-between",
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>{s.name}</Text>
                      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        {s.duration_minutes} min
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: BRAND }}>
                      {fmtCurrency(s.price_cents)}
                    </Text>
                  </TouchableOpacity>
                ))}
                {services.length === 0 && (
                  <Text style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: 16 }}>
                    Nenhum serviço ativo cadastrado.
                  </Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setSelectedService(null)}
                style={{
                  ...INPUT_STYLE, flexDirection: "row", alignItems: "center", gap: 10,
                  backgroundColor: BRAND + "15", borderColor: BRAND + "40",
                }}
                activeOpacity={0.8}
              >
                <Scissors size={16} color={BRAND} strokeWidth={1.8} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: BRAND }}>{selectedService.name}</Text>
                  <Text style={{ fontSize: 12, color: BRAND + "99" }}>
                    {selectedService.duration_minutes} min · {fmtCurrency(selectedService.price_cents)}
                  </Text>
                </View>
                <X size={16} color={BRAND} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Data e hora ── */}
          <View style={{ marginBottom: 18 }}>
            <SectionLabel>DATA E HORA</SectionLabel>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={{ ...INPUT_STYLE, flex: 1 }}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94a3b8"
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={{ ...INPUT_STYLE, width: 90 }}
                placeholder="HH:MM"
                placeholderTextColor="#94a3b8"
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* ── Resumo ── */}
          {selectedService && (
            <View style={{
              backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 16,
              borderWidth: 1, borderColor: "#e2e8f0",
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", marginBottom: 8 }}>RESUMO</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 14, color: "#475569" }}>{selectedService.name}</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                  {fmtCurrency(selectedService.price_cents)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Clock size={12} color="#94a3b8" strokeWidth={1.8} />
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                  {selectedService.duration_minutes} min · {date} às {time}
                </Text>
              </View>
            </View>
          )}

          {/* ── Botão confirmar ── */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving || (!selectedCustomer && !newCustomerName.trim()) || !selectedService}
            style={{
              backgroundColor: BRAND, borderRadius: 16,
              paddingVertical: 16, alignItems: "center",
              opacity: (saving || (!selectedCustomer && !newCustomerName.trim()) || !selectedService) ? 0.4 : 1,
            }}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Confirmar agendamento</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
