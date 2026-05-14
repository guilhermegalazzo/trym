"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { signUpSchema, type SignUpInput } from "@trym/api/schemas";
import { TrymLogo } from "@/components/brand/logo";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<"customer" | "professional">("professional");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: "professional" },
  });

  async function onSubmit(data: SignUpInput) {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone ?? null,
          role: data.role,
        },
      },
    });

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <TrymLogo iconSize={48} />
          <p className="mt-3 text-sm text-neutral-500">Crie sua conta gratuitamente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Criar conta</h2>
            <p className="mt-1 text-sm text-neutral-500">Comece seu período de 14 dias grátis.</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
            {(["professional", "customer"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  role === r
                    ? "bg-white text-brand-600 shadow-card"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {r === "professional" ? "Profissional" : "Cliente"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit((d) => onSubmit({ ...d, role }))} className="space-y-4">
            <input type="hidden" value={role} {...register("role")} />

            <div className="space-y-1">
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                {...register("fullName")}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Seu nome"
              />
              {errors.fullName && (
                <p className="text-xs text-danger">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="voce@exemplo.com"
              />
              {errors.email && (
                <p className="text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && (
                <p className="text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Criando conta…" : "Criar conta grátis"}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-500">
            Já tem conta?{" "}
            <a href="/login" className="font-medium text-brand-500 hover:underline">
              Entrar
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-neutral-400">
          Ao criar uma conta você aceita os{" "}
          <a href="/termos" target="_blank" className="underline hover:text-neutral-600">Termos de Uso</a>
          {" "}e a{" "}
          <a href="/privacidade" target="_blank" className="underline hover:text-neutral-600">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}
