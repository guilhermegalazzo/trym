"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TrymLogo } from "@/components/brand/logo";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function RedefinirSenhaPage() {
  const router  = useRouter();
  const supabase = createClient();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [ready, setReady]         = useState(false);

  useEffect(() => {
    // Supabase sets the session from the email link hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">Senha redefinida!</h2>
          <p className="text-sm text-neutral-500">Redirecionando para o painel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <TrymLogo iconSize={48} />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Nova senha</h2>
            <p className="mt-1 text-sm text-neutral-500">Escolha uma senha segura para sua conta.</p>
          </div>

          {!ready && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
              Aguardando validação do link de recuperação…
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nova senha</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={!ready}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Confirmar senha</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                disabled={!ready}
                placeholder="Repita a senha"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 transition-all"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Salvando…" : "Redefinir senha"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
