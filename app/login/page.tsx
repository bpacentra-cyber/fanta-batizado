"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const redirectTo = useMemo(() => `${getOrigin()}/auth/callback`, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMagicLink() {
    setErr("");
    setMsg("");

    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) {
      setErr("Inserisci un’email valida.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          emailRedirectTo: redirectTo, // ✅ fondamentale per Vercel
        },
      });

      if (error) throw error;

      setMsg(
        `✅ Link inviato a ${e}. Apri l’email e clicca il bottone (dallo stesso browser).`
      );
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’invio del link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Login</h1>
          <div className="flex gap-2">
            <Link
              href="/regolamento"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              📜 Regolamento
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Regolamento mini in pagina */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-lg font-extrabold">Prima di entrare: due regole al volo</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70 list-disc pl-5">
            <li>Il punteggio si aggiorna automaticamente quando l’Admin assegna un’azione.</li>
            <li>Le azioni possono avere bonus o malus: gioca pulito e divertiti. Axé 🔥</li>
            <li>Per i dettagli completi: apri “Regolamento”.</li>
          </ul>
        </section>

        {/* Box login */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-sm text-white/70">
            Inserisci la tua email: ti mandiamo un <b>magic link</b>.
            Aprilo <b>dallo stesso browser/dispositivo</b> con cui stai facendo login.
          </p>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              ❌ {err}
            </div>
          ) : null}

          {msg ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {msg}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <label className="block text-xs text-white/60">Email</label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="nome@email.com"
              autoComplete="email"
            />

            <button
              onClick={sendMagicLink}
              disabled={busy}
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-extrabold hover:bg-white/15 disabled:opacity-40"
            >
              {busy ? "Invio..." : "Invia magic link"}
            </button>

            <div className="text-xs text-white/45">
              Redirect: <span className="text-white/60">{redirectTo}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
