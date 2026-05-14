"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TrymLogo } from "@/components/brand/logo";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function RecuperarSenhaPage() {
  const supabase = createClient();
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/redefinir-senha`
        : "/redefinir-senha";

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);

    if (err) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-up"
      style={{ background: "var(--color-surface-1)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <TrymLogo iconSize={48} />
        </div>

        <div className="p-8 space-y-6 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(32px) saturate(200%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
          {sent ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">E-mail enviado!</h2>
                <p className="text-sm text-neutral-500 mt-2">
                  Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.
                </p>
              </div>
              <Link href="/login" className="text-sm font-semibold text-brand-600 hover:underline">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Recuperar senha</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      className="w-full rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm pl-9 pr-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all text-text-primary placeholder:text-text-tertiary"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-ink disabled:opacity-60 transition-all"
                  style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(127,209,193,0.40)" }}
                >
                  {loading ? "Enviando…" : "Enviar link de recuperação"}
                </button>
              </form>

              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
