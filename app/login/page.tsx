"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) router.replace("/profile");
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function sendMagicLink() {
    setMsg("");
    const e = email.trim().toLowerCase();
    if (!e) {
      setMsg("❌ Inserisci un’email valida.");
      return;
    }

    setBusy(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      setMsg("✅ Link inviato! Controlla email (anche spam).");
    } catch (err: any) {
      setMsg(`❌ ${err?.message ?? "Errore inatteso"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HEADER */}
      <div className="relative overflow-hidden">
        {/* background decorativo (NON blocca click) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-44 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-60 right-[-160px] h-[560px] w-[560px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-10 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>Fanta Batizado</Badge>
                <Badge>Magic Link</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                🔐 Login
              </h1>
              <p className="text-white/70 leading-relaxed max-w-2xl">
                Entra con il Magic Link. Niente password, niente sbatti.
              </p>
            </div>

            {/* BOTTONI (cliccabili) */}
            <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-6xl px-6 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* FORM LOGIN */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <h2 className="text-xl font-extrabold tracking-tight">
              Inserisci la tua email
            </h2>
            <p className="mt-2 text-white/70">
              Ti mandiamo un link: clicchi e sei dentro.
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="es. nome@email.com"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/20"
                autoComplete="email"
                inputMode="email"
              />

              <button
                onClick={sendMagicLink}
                disabled={busy}
                className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                {busy ? "Invio..." : "Invia Magic Link ✉️"}
              </button>

              {msg ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                  {msg}
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Link
                href="/regolamento"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Vai a Regolamento →
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Torna Home
              </Link>
            </div>
          </section>

          {/* MINI REGOLAMENTO */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <h2 className="text-xl font-extrabold tracking-tight">
              📜 Mini-Regolamento (spoiler)
            </h2>

            <div className="mt-4 space-y-3 text-white/80 leading-relaxed">
              <p>
                Benvenuto nel gioco che nessuno aveva chiesto… ma che ora nessuno
                potrà più ignorare.
              </p>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="font-bold text-white">Prime 2 regole:</p>
                <p className="mt-2 text-white/80">
                  • Prima regola: non parlare del Fanta Batizado
                  <br />
                  • Seconda regola: NON parlare del Fanta Batizado
                </p>
              </div>

              <p>
                Budget: <b>500 Dbr</b>. Squadra: <b>1–6 membri</b>. Bonus e malus:
                <b> inevitabili</b>.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Badge>Goliardico</Badge>
                <Badge>Realtime</Badge>
                <Badge>Axé 🔥</Badge>
              </div>

              <Link
                href="/regolamento"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                Leggi tutto il regolamento →
              </Link>
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
