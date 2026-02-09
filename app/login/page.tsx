"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function siteUrl() {
  // In prod su Vercel: location.origin è già https://fanta-batizado.vercel.app
  if (typeof window !== "undefined") return window.location.origin;
  // fallback (non dovrebbe servire)
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const redirectTo = useMemo(() => `${siteUrl()}/auth/callback`, []);

  useEffect(() => {
    // Se già loggato, vai in home
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
          emailRedirectTo: redirectTo, // ✅ QUI la magia: sempre callback corretta
        },
      });

      if (error) throw error;

      setMsg(
        `✅ Link inviato a ${e}. Apri l’email e clicca il bottone: ti porterà su ${redirectTo}`
      );
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’invio del link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-xl px-6 py-12">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">Login</h1>
            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Home
            </Link>
          </div>

          <p className="mt-2 text-sm text-white/70">
            Ti mandiamo un magic link via email. Aprilo dallo stesso dispositivo/browser
            con cui stai facendo login.
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
              onChange={(e) => setEmail(e.target.value)}
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

            <div className="text-xs text-white/50">
              Redirect attuale: <span className="text-white/70">{redirectTo}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
