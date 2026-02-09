"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Se già loggato, manda al profilo
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        window.location.href = "/profile";
      }
    })();
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const mail = email.trim().toLowerCase();
    if (!mail) {
      setErr("Inserisci una mail valida.");
      return;
    }

    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.signInWithOtp({
        email: mail,
        options: {
          // IMPORTANTISSIMO in produzione
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMsg(
        "✅ Magic link inviato! Controlla la mail (anche spam). Apri il link sullo stesso device/browser."
      );
      setEmail("");
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l'invio del magic link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Top bar */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Home
          </Link>

          <Link
            href="/regolamento"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            📜 Regolamento
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Login card */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
                Fanta Batizado
              </span>
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
                Magic Link
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Entra nel gioco
            </h1>

            <p className="mt-2 text-white/70 leading-relaxed">
              Vabè ma davvero devo spiegarti come ci si registra? Lo farò comunque, inserisci la tua mail qui sotto e clicca per ricevere il link magico! 
            </p>

            <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
              <div>
                <label className="text-xs text-white/60">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="nome@email.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-white/20"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {loading ? "Invio..." : "Invia Magic Link ✨"}
              </button>

              {msg ? (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">
                  {msg}
                </div>
              ) : null}

              {err ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  ❌ {err}
                </div>
              ) : null}

              <div className="text-xs text-white/50 leading-relaxed">
                Tip: apri il magic link <b>sullo stesso browser</b> con cui hai
                richiesto l’accesso.
              </div>
            </form>
          </section>

          {/* Mini regolamento box */}
          <section className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.10] to-white/[0.05] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <h2 className="text-xl font-extrabold tracking-tight">
              📜 Mini-Regolamento (leggi il regolamento per intero! Non farti prendere dalla pigrizia!)
            </h2>
            <p className="mt-2 text-white/75 leading-relaxed">
              Benvenuto nel gioco che nessuno aveva chiesto… ma che ora nessuno
              potrà più ignorare.
            </p>

            <div className="mt-4 space-y-2 text-sm text-white/80">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                🗣 <b>Regola #1 del FANTA BATIZADO:</b> non parlate mai del Fanta Batizado.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                💰 <b>Budget:</b> 500 Dbr per squadra.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                👥 <b>Squadra:</b> da 1 a 6 membri.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                ⚡ <b>Punti:</b> bonus e malus assegnati dall’Admin Supremo.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/regolamento"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Vai al Regolamento →
              </Link>
              <Link
                href="/"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Torna alla Home →
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/50">
              Nota: Entrando accetti che l’Admin e i founders abbiano sempre ragione. Anche
              quando non ce l’hanno.
            </p>
          </section>
        </div>

        <div className="mt-8 flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </div>
    </main>
  );
}
