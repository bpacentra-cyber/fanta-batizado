"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // se già loggato, vai a home
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) router.replace("/");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;

      setMsg("✅ Magic link inviato! Controlla la mail e clicca sul link.");
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’invio del magic link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* top buttons */}
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* login box */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Login — Fanta Batizado
            </h1>
            <p className="mt-2 text-white/70 leading-relaxed">
              Inserisci la tua email: ti mando un Magic Link. Niente password, niente ansia.
            </p>

            <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
              <div>
                <label className="text-xs text-white/60">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@email.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                  type="email"
                  required
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                {loading ? "Invio..." : "Invia Magic Link ✉️"}
              </button>

              {msg ? (
                <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-4 text-green-200 text-sm">
                  {msg}
                </div>
              ) : null}
              {err ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-red-200 text-sm">
                  ❌ {err}
                </div>
              ) : null}
            </form>

            <div className="mt-6 text-xs text-white/45">
              Se clicchi sul link e “non succede niente”, aprilo con lo stesso browser dove hai l’app.
            </div>
          </section>

          {/* regolamento preview */}
          <section className="rounded-[28px] border border-white/10 bg-black/30 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold tracking-tight">📜 Regolamento (preview)</h2>
              <Link
                href="/regolamento"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Vai a Regolamento →
              </Link>
            </div>

            <p className="mt-3 text-white/75 leading-relaxed">
              Benvenuti nel gioco che nessuno aveva chiesto… ma che ora nessuno potrà più ignorare.
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
              <div className="font-bold">Prima regola:</div>
              <div>Non parlate mai del Fanta Batizado.</div>
              <div className="mt-2 font-bold">Seconda regola:</div>
              <div>Non parlate mai del Fanta Batizado!</div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                💰 Budget: <b>500 Dbr</b>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                👥 Squadra: <b>1–6 membri</b>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                ⚡ Punti: <b>Bonus & Malus</b>
              </div>
            </div>
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
