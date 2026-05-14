"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { signInSchema, type SignInInput } from "@trym/api/schemas";
import { TrymLogo } from "@/components/brand/logo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <TrymLogo iconSize={48} />
          <p className="mt-3 text-sm text-neutral-500">Painel do Profissional</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Entrar</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Acesse sua conta para gerenciar seu negócio.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Senha
                </label>
                <a href="/recuperar-senha" className="text-xs text-brand-500 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="••••••••"
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
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-500">
            Não tem conta?{" "}
            <a href="/signup" className="font-medium text-brand-500 hover:underline">
              Criar conta grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
