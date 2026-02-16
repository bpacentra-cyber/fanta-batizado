"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("Accesso in corso…");

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        // Magic link / PKCE: spesso arriva ?code=...
        const code = sp.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // fallback: prova a leggere sessione già presente
          await supabase.auth.getSession();
        }

        if (!mounted) return;

        // vai alla home
        router.replace("/");
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setMsg(`❌ Login fallito: ${e?.message ?? "errore sconosciuto"}`);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [router, sp]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/80">
        {msg}
      </div>
    </div>
  );
}
