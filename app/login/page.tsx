"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) router.replace("/");
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function sendMagicLink() {
    setErr("");
    setMsg("");

    const e = email.trim();
    if (!e || !e.includes("@")) {
      setErr("Inserisci una mail valida 👀");
      return;
    }

    setSending(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      // ✅ STRATEGIA: token nel link (hash) + setSession in callback
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setMsg(
        "📩 Magic Link inviato! Apri la mail e clicca il link. Se sei su mobile: aprilo in Safari/Chrome (non anteprima)."
      );
      setEmail("");
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’invio del Magic Link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">🔐 Login</h1>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Home
            </Link>
            <Link
              href="/regolamento"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              📜 Regolamento
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
          <label className="block text-sm text-white/75">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@esempio.com"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/20"
            autoComplete="email"
            inputMode="email"
          />

          <button
            onClick={sendMagicLink}
            disabled={sending}
            className="mt-4 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
          >
            {sending ? "Invio in corso…" : "📩 Invia Magic Link"}
          </button>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              ❌ {err}
            </div>
          ) : null}

          {msg ? (
            <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100">
              ✅ {msg}
            </div>
          ) : null}

          <div className="mt-4 text-xs text-white/55 leading-relaxed">
            Su iPhone/Android: se il link si apre “dentro” Gmail/WhatsApp e non va,
            apri la mail in Safari/Chrome e riprova.
          </div>
        </div>
      </div>
    </main>
  );
}
