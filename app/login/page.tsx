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

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xl">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          <div className="mt-2 text-white/80 leading-relaxed">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  // Se sei già loggato, vai a home
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

      const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
if (error) throw error;


      setMsg(
        "📩 Magic Link inviato! Apri la mail e clicca il link. (Se non arriva, controlla spam / promozioni.)"
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
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>Fanta Batizado</Badge>
                <Badge>Accesso</Badge>
                <Badge>Magic Link ✉️</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                🚪 Entra nel gioco <span className="text-white/70"></span>
              </h1>

              <p className="text-white/70 leading-relaxed max-w-xl">
                Non serve dirti cosa dovrai fare...<b>già sai</b>
                <br />
                <br />
                Con il Magic Link sarai <b>ufficialmente</b> dentro il <b>Fanta Batizado.</b> 🔥
              </p>
            </div>

            {/* NAV in alto a destra */}
            <div className="flex flex-col gap-2 shrink-0">
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
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-5xl px-6 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LOGIN BOX */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <h2 className="text-xl font-extrabold tracking-tight">🔐 Login (Magic Link)</h2>
            <p className="mt-2 text-white/70">
              Inserisci la tua email e ricevi il link di accesso.
            </p>

            <div className="mt-5 space-y-3">
              <label className="block text-sm text-white/75">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/20"
                autoComplete="email"
                inputMode="email"
              />

              <button
                onClick={sendMagicLink}
                disabled={sending}
                className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                {sending ? "Invio in corso…" : "📩 Invia Magic Link"}
              </button>

              {err ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  ❌ {err}
                </div>
              ) : null}

              {msg ? (
                <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100">
                  ✅ {msg}
                </div>
              ) : null}

              <div className="text-xs text-white/55 leading-relaxed">
                Tip da Instrutor Frodo: se il link non arriva, guarda in <b>Spam</b>.
                <br />
                E no: non puoi entrare “a forza”. (Ci abbiamo provato)
              </div>
            </div>
          </section>

          {/* REGOLAMENTO PREVIEW */}
          <div className="space-y-5">
            <Card title="Mini-regolamento (leggi il regolamento completo)" icon="📜">
              <ul className="mt-1 list-disc pl-5 space-y-1">
                <li>
                  💰 Hai <b>500 Dbr</b> e una missione: creare la squadra più devastante.
                </li>
                <li>
                  🤸‍♂️ Scegli <b>1–6 membri</b>. Il budget scala mentre scegli.
                </li>
                <li>
                  👑 <b>Admin Supremo:</b> Instrutor Frodo. I pianti valgono, ma non cambiano le regole.
                </li>
                <li>
                 ➕➖ Bonus & malus li vedi nella sezione <b>Azioni</b>.
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/regolamento"
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Vai a Regolamento →
                </Link>
                <Link
                  href="/azioni"
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Vedi Azioni →
                </Link>
              </div>
            </Card>

            <Card title="Disclaimer importantissimo" icon="🚨">
              <p>
                <b>Prima regola del FANTA BATIZADO:</b> NON parlare mai del Fanta Batizado.
                <br />
                <b>Seconda regola:</b> Ricordati la prima.
              </p>
              <p className="mt-2 text-white/75">
                Se sei qui, vuol dire che sei nella “cerchia ristretta”.
                Comportati di conseguenza. 😎
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </div>
    </main>
  );
}
