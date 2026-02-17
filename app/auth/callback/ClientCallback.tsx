"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Sto completando l’accesso…");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      setErr("");
      setMsg("Sto completando l’accesso…");

      try {
        // Supabase magic link: può arrivare con ?code=...
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Se ora ho sessione, provo a marcare founder (se allowlisted)
        const { data: sess } = await supabase.auth.getSession();
        const user = sess.session?.user;

        if (user) {
          // Chiamata sicura a DB: setta is_founder=true SOLO se email allowlisted
          const { error: rpcErr } = await supabase.rpc("mark_founder");
          // se fallisce non blocchiamo il login
          if (rpcErr) {
            console.warn("mark_founder rpc error:", rpcErr.message);
          }
        }

        if (!mounted) return;

        setMsg("✅ Accesso completato! Ti porto alla Home…");
        router.replace("/");
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? "Errore durante il login.");
        setMsg("");
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
        <div className="text-2xl font-extrabold">🪘 Fanta Batizado</div>

        {msg ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-white/80">
            {msg}
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        <div className="mt-4 text-xs text-white/50">
          Se la pagina resta qui, aggiorna una volta e riprova il magic link.
        </div>
      </div>
    </main>
  );
}
