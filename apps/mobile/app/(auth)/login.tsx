import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { signInSchema, type SignInInput } from "@trym/api/schemas";

export default function LoginScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(data: SignInInput) {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError("E-mail ou senha inválidos.");
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-12">
          <View className="relative w-20 h-20 rounded-[18px] bg-gradient-to-br items-center justify-center mb-4"
            style={{ backgroundColor: "#0F766E" }}>
            <Text style={{ fontSize: 40, fontWeight: "700", color: "#fff", lineHeight: 48 }}>T</Text>
            <View className="absolute bottom-2.5 right-2.5 w-4 h-4 rounded-full bg-accent-400" />
          </View>
          <Text className="text-2xl font-bold text-neutral-900 tracking-tight">Trym</Text>
          <Text className="mt-1 text-sm text-neutral-500">Reserve em segundos</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          <View className="space-y-1">
            <Text className="text-sm font-medium text-neutral-700">E-mail</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900"
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
              <Text className="text-xs text-danger">{errors.email.message}</Text>
            )}
          </View>

          <View className="space-y-1">
            <Text className="text-sm font-medium text-neutral-700">Senha</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  autoComplete="current-password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && (
              <Text className="text-xs text-danger">{errors.password.message}</Text>
            )}
          </View>

          {serverError && (
            <View className="rounded-xl bg-danger/10 px-4 py-3">
              <Text className="text-xs text-danger">{serverError}</Text>
            </View>
          )}

          <TouchableOpacity
            className="mt-2 rounded-xl bg-brand-500 py-3.5 items-center"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-sm font-semibold text-white">Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="mt-8 text-center text-sm text-neutral-500">
          Não tem conta?{" "}
          <Text
            className="font-semibold text-brand-500"
            onPress={() => router.replace("/(auth)/signup")}
          >
            Criar conta
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
