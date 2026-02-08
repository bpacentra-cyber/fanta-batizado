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

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      // se già loggato → vai home
      if (data.session?.user) router.replace("/");
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setErr("Inserisci un’email valida.");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          // IMPORTANTE: deve corrispondere al tuo flow che gestisce il callback
          // (se in passato hai usato /auth/callback o /login, qui va bene /login)
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      setMsg(
        "✅ Link inviato! Apri la mail e clicca sul Magic Link (controlla anche spam/promozioni)."
      );
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’invio del link.");
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
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>Fanta Batizado</Badge>
                <Badge>Login</Badge>
                <Badge>Magic Link</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Entra nel gioco 🪘
              </h1>

              <p className="text-white/70 leading-relaxed max-w-2xl">
                Inserisci la mail e riceverai un link per accedere.
                <br />
                Nessuna password. Nessun dramma. (Ok forse un po’.)
              </p>
            </div>

            <div className="flex items-center gap-2">
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
      <div className="mx-auto w-full max-w-5xl px-6 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LOGIN CARD */}
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <h2 className="text-xl font-extrabold tracking-tight">
              🔐 Login (Magic Link)
            </h2>
            <p className="mt-2 text-white/70 text-sm leading-relaxed">
              Ti arriva una mail. Clicchi. Fine. Se non arriva: controlla spam.
            </p>

            <form onSubmit={sendMagicLink} className="mt-5 space-y-3">
              <div>
                <label className="text-xs text-white/60">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@mail.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-white/20"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              {err ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  ❌ {err}
                </div>
              ) : null}

              {msg ? (
                <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-100">
                  {msg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                {sending ? "Invio in corso…" : "Invia Magic Link"}
              </button>

              <div className="text-xs text-white/50">
                Se clicchi il link e ti dice “manca code”, parlane con l'admin: Instrutor Frodo
              </div>
            </form>
          </section>

          {/* REGOLAMENTO PREVIEW */}
          <div className="space-y-5">
            <Card title="Regolamento (preview)" icon="📜">
              <p className="text-white/80">
                <b>• Prima regola del FANTA BATIZADO</b>: Non parlate mai del Fanta Batizado<br /><br />
                <b>• Seconda regola del FANTA BATIZADO</b>: Non parlate mai del Fanta Batizado!
              <br /><br />
                  Ti basta sapere questo per ora. Il resto lo trovi
                  nella pagina completa del regolamento. Leggilo tutto, è più ignorante di quello che sembra.
                </p>
              <div className="mt-3 space-y-2 text-white/75 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="font-bold">🎯 Missione</div>
                  <div className="mt-1">
                    Crea la squadra più devastante e raggiungi la gloria...oppure perdi inesorabilmente ma con stile.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="font-bold">💰 Budget</div>
                  <div className="mt-1">
                    500 Dbr a testa. Spendi bene… oppure fai all-in su un Mestre
                    e prega.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="font-bold">⚡ Bonus & Malus</div>
                  <div className="mt-1">
                    Le azioni vengono assegnate dal team organizzativp. La classifica si
                    aggiorna da sola. Tu devi solo goderti lo spettacolo.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/regolamento"
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Leggi tutto →
                </Link>
                <Link
                  href="/azioni"
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Vedi Azioni →
                </Link>
              </div>

              <p className="mt-4 text-xs text-white/50">
                *Il regolamento è ufficiale finché l'admin supremo non cambia idea.
              </p>
            </Card>

            <Card title="Tip rapido" icon="🧠">
              <p className="text-white/80">
                Dopo il login vai su <b>Profilo</b> e carica la foto: così nella
                classifica la tua faccia sarà visibile a tutti. (Sì, è una
                minaccia.)
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </div>
    </main>
  );
}
