"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Sto completando l’accesso…");

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        // In PKCE su Supabase spesso basta exchangeCodeForSession
        // (se non c’è code, Supabase può comunque rilevare la sessione dall’URL)
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // fallback: prova a leggere sessione
          await supabase.auth.getSession();
        }

        if (!mounted) return;
        setMsg("✅ Accesso completato! Ti porto alla Home…");
        router.replace("/");
      } catch (e: any) {
        if (!mounted) return;
        setMsg(`❌ Errore login: ${e?.message ?? "sconosciuto"}`);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [params, router]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        <div className="text-xl font-extrabold">Auth callback</div>
        <div className="mt-3 text-white/80">{msg}</div>
      </div>
    </main>
  );
}
