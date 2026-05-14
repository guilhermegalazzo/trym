"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { signUpSchema, type SignUpInput } from "@trym/api/schemas";
import { TrymLogo } from "@/components/brand/logo";

const inputCls = [
  "w-full rounded-xl border px-4 py-3 text-sm text-text-primary placeholder-text-tertiary",
  "outline-none transition-all duration-200",
  "bg-white/60 backdrop-blur-sm",
  "border-white/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20",
  "shadow-sm",
].join(" ");

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--color-surface-1)" }}>
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-10">
          <TrymLogo iconSize={48} />
          <p className="mt-3 text-sm text-text-tertiary">Crie sua conta gratuitamente</p>
        </div>

        {/* Glass card */}
        <div
          className="p-8 space-y-6 rounded-2xl"
          style={{
            background: "#ffffff",
            border: "1px solid #E8E8E8",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary" style={{ letterSpacing: "-0.03em" }}>
              Criar conta
            </h2>
            <p className="mt-1 text-sm text-text-tertiary">Comece seu período de 14 dias grátis.</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl"
            style={{ background: "#F5F5F5" }}>
            {(["professional", "customer"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="rounded-xl py-2 text-xs font-semibold transition-all duration-200"
                style={role === r ? {
                  background: "#ffffff",
                  color: "var(--accent-hover)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                } : { color: "var(--ink-muted)" }}
              >
                {r === "professional" ? "Profissional" : "Cliente"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit((d) => onSubmit({ ...d, role }))} className="space-y-4">
            <input type="hidden" value={role} {...register("role")} />

            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                {...register("fullName")}
                className={inputCls}
                placeholder="Seu nome"
              />
              {errors.fullName && (
                <p className="text-xs text-danger">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className={inputCls}
                placeholder="voce@exemplo.com"
              />
              {errors.email && (
                <p className="text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                className={inputCls}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && (
                <p className="text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-2.5 text-xs text-danger">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "var(--accent)",
                color: "var(--ink)",
                boxShadow: "0 4px 16px rgba(127,209,193,0.40)",
              }}
            >
              {isSubmitting ? "Criando conta…" : "Criar conta grátis"}
            </button>
          </form>

          <div className="divider-gradient" />

          <p className="text-center text-xs text-text-tertiary">
            Já tem conta?{" "}
            <a href="/login" className="font-semibold text-brand-600 hover:text-brand-500 hover:underline transition-colors">
              Entrar
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-text-tertiary">
          Ao criar uma conta você aceita os{" "}
          <a href="/termos" target="_blank" className="underline hover:text-text-secondary transition-colors">Termos de Uso</a>
          {" "}e a{" "}
          <a href="/privacidade" target="_blank" className="underline hover:text-text-secondary transition-colors">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}
