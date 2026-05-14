"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { signInSchema, type SignInInput } from "@trym/api/schemas";
import { TrymLogo } from "@/components/brand/logo";

const inputCls = [
  "w-full rounded-xl border px-4 py-3 text-sm text-text-primary placeholder-text-tertiary",
  "outline-none transition-all duration-200",
  "bg-white/60 backdrop-blur-sm",
  "border-white/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20",
  "shadow-sm",
].join(" ");

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(data: SignInInput) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", { message: "E-mail ou senha inválidos." });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-surface-1)" }}>
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <TrymLogo iconSize={48} />
          <p className="mt-3 text-sm text-text-tertiary">Painel do Profissional</p>
        </div>

        {/* Glass card */}
        <div
          className="p-8 space-y-6 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(32px) saturate(200%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.70)",
            boxShadow: "0 24px 64px rgba(10,10,10,0.08), 0 8px 24px rgba(10,10,10,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary" style={{ letterSpacing: "-0.03em" }}>
              Entrar
            </h2>
            <p className="mt-1 text-sm text-text-tertiary">
              Acesse sua conta para gerenciar seu negócio.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Senha
                </label>
                <a href="/recuperar-senha" className="text-xs text-brand-600 hover:text-brand-500 hover:underline transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className={inputCls}
                placeholder="••••••••"
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
              onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(127,209,193,0.50), 0 -1px 0 rgba(0,0,0,0.08) inset"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(127,209,193,0.40)"; }}
            >
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="divider-gradient" />

          <p className="text-center text-xs text-text-tertiary">
            Não tem conta?{" "}
            <a href="/signup" className="font-semibold text-brand-600 hover:text-brand-500 hover:underline transition-colors">
              Criar conta grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
