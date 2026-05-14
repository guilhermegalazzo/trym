import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { signUpSchema, type SignUpInput } from "@trym/api/schemas";

const BRAND = "#0F766E";

const INPUT_STYLE = {
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#e2e8f0",
  backgroundColor: "#fff",
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  color: "#0f172a",
} as const;

export default function SignupScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: "professional" },
  });

  async function onSubmit(data: SignUpInput) {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone ?? null,
          role: "professional",
        },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 24,
          backgroundColor: BRAND + "20",
          alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <Text style={{ fontSize: 36 }}>✉️</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a", textAlign: "center" }}>
          Verifique seu e-mail
        </Text>
        <Text style={{
          fontSize: 14, color: "#64748b", textAlign: "center",
          marginTop: 10, lineHeight: 22, maxWidth: 280,
        }}>
          Enviamos um link de confirmação. Após confirmar, entre com sua conta para começar a usar o Trym.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={{
            marginTop: 28, backgroundColor: BRAND,
            borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 20,
            backgroundColor: BRAND,
            alignItems: "center", justifyContent: "center", marginBottom: 12,
          }}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: "#fff", lineHeight: 44 }}>T</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>Criar conta</Text>
          <Text style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
            Gerencie seu negócio com o Trym
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 14 }}>
          {/* Nome */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>Nome completo</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={INPUT_STYLE}
                  placeholder="Seu nome"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                  autoComplete="name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.fullName && (
              <Text style={{ fontSize: 12, color: "#ef4444" }}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* E-mail */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>E-mail</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={INPUT_STYLE}
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text style={{ fontSize: 12, color: "#ef4444" }}>{errors.email.message}</Text>
            )}
          </View>

          {/* Telefone */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>
              Telefone <Text style={{ color: "#94a3b8", fontWeight: "400" }}>(opcional)</Text>
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={INPUT_STYLE}
                  placeholder="+55 11 99999-9999"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value ?? ""}
                />
              )}
            />
          </View>

          {/* Senha */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>Senha</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={INPUT_STYLE}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  autoComplete="new-password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && (
              <Text style={{ fontSize: 12, color: "#ef4444" }}>{errors.password.message}</Text>
            )}
          </View>

          {serverError && (
            <View style={{ backgroundColor: "#fee2e2", borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 13, color: "#b91c1c" }}>{serverError}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={{
              marginTop: 4,
              backgroundColor: BRAND,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Criar conta</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <Text style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#94a3b8" }}>
          Já tem conta?{" "}
          <Text
            style={{ fontWeight: "700", color: BRAND }}
            onPress={() => router.replace("/(auth)/login")}
          >
            Entrar
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
