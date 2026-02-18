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
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xl">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <div className="mt-2 text-white/80">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Se già loggato → home
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session?.user) {
        router.replace("/");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function sendMagicLink() {
    setErr("");
    setMsg("");

    if (!email.includes("@")) {
      setErr("Inserisci una mail valida 👀");
      return;
    }

    setSending(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setMsg("📩 Controlla la mail e clicca il link!");
      setEmail("");
    } catch (e: any) {
      setErr(e.message);
    }

    setSending(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HEADER */}
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold">🚪 Login</h1>
          <p className="text-white/70 mt-2">
            Entra nel <b>Fanta Batizado</b>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="rounded-2xl border border-white/15 px-4 py-2 text-sm"
          >
            ← Home
          </Link>

          <Link
            href="/regolamento"
            className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-semibold"
          >
            📜 Regolamento
          </Link>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-5xl px-6 pb-14 grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LOGIN */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-extrabold">🔐 Accesso</h2>

          <p className="mt-2 text-white/70">
            Inserisci la tua email e riceverai un link per entrare.
          </p>

          {/* ⚠️ AVVISO IMPORTANTE PER TUTTI */}
          <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            ⚠️ <b>IMPORTANTE</b>
            <br />
            Se apri il link dalla mail e poi esci dall'app, potrebbe chiederti di fare login di nuovo.
            <br /><br />
            👉 Per evitare questo:
            <br />
            1. Apri il link della mail  
            <br />
            2. Entra nell'app  
            <br />
            3. Poi usa sempre <b>lo stesso browser</b>  
            <br /><br />
            ⚡ Se aggiungi l’app alla Home, usa sempre quel browser.
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            />

            <button
              onClick={sendMagicLink}
              disabled={sending}
              className="w-full rounded-2xl bg-white text-black px-4 py-3 font-semibold"
            >
              {sending ? "Invio..." : "📩 Invia Magic Link"}
            </button>

            {err && (
              <div className="text-red-400 text-sm">❌ {err}</div>
            )}

            {msg && (
              <div className="text-green-400 text-sm">✅ {msg}</div>
            )}
          </div>
        </section>

        {/* INFO */}
        <div className="space-y-5">
          <Card title="📜 Come funziona" icon="🔥">
            <ul className="list-disc pl-5 space-y-1">
              <li>💰 500 Dbr per la squadra</li>
              <li>👥 1–6 membri</li>
              <li>⚡ bonus & malus durante il batizado</li>
              <li>🏆 vince chi fa più punti</li>
            </ul>
          </Card>

          <Card title="🚨 Disclaimer" icon="😈">
            <p>
              <b>Prima regola del Fanta Batizado:</b> NON parlare mai del Fanta Batizado
              <br />
              <b>Seconda regola del Fanta Batizado:</b> ricordati la prima!
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
