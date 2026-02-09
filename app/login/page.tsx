"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
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
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      setMsg(
        `✅ Link inviato a ${e}. Apri l’email e clicca il bottone (dallo stesso browser/dispositivo).`
      );
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’invio del link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>🔑 Login</Badge>
                <Badge>Magic Link</Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Entra nel Fanta Batizado
              </h1>
              <p className="text-white/70 leading-relaxed max-w-2xl">
                Inserisci la tua email: ti mandiamo un link di accesso. Niente password, solo Axé 🔥
              </p>
            </div>

            {/* top buttons */}
            <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-6xl px-6 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: login box */}
          <section className="lg:col-span-7 rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <h2 className="text-xl font-extrabold tracking-tight">Accedi</h2>
            <p className="mt-2 text-sm text-white/70">
              Ti inviamo un <b>magic link</b>. Aprilo <b>dallo stesso browser</b> con cui stai facendo login.
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

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs text-white/60">Email</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="nome@email.com"
                  autoComplete="email"
                />
                <div className="mt-2 text-[11px] text-white/45">
                  Redirect: <span className="text-white/60">{redirectTo}</span>
                </div>
              </div>

              <button
                onClick={sendMagicLink}
                disabled={busy}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-extrabold hover:bg-white/15 disabled:opacity-40"
              >
                {busy ? "Invio..." : "Invia magic link"}
              </button>

              <div className="text-xs text-white/45">
                Tip: se apri il link su un dispositivo diverso, potresti non avere la sessione pronta.
              </div>
            </div>
          </section>

          {/* RIGHT: regolamento teaser */}
          <aside className="lg:col-span-5 rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">📌 Regole rapide</h3>
                <p className="mt-1 text-sm text-white/65">
                  Un assaggio del regolamento (quello completo lo trovi col bottone sopra).
                </p>
              </div>
              <span className="rounded-2xl border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                TL;DR
              </span>
            </div>

            <div className="mt-4 space-y-3 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="font-extrabold">1) Punti</div>
                <div className="mt-1 text-white/70">
                  Ogni azione assegnata vale <b>bonus o malus</b>. La classifica si aggiorna in realtime.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="font-extrabold">2) Squadre</div>
                <div className="mt-1 text-white/70">
                  Ogni squadra ha un capo e dei membri. Il capo gestisce la sua squadra (dove previsto).
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="font-extrabold">3) Fair play</div>
                <div className="mt-1 text-white/70">
                  Si gioca per divertirsi: niente polemiche, solo competizione sana. Axé 🔥
                </div>
              </div>
            </div>

            <Link
              href="/regolamento"
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-extrabold hover:bg-white/10"
            >
              Apri regolamento completo →
            </Link>
          </aside>
        </div>

        <div className="mt-8 flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </div>
    </main>
  );
}
