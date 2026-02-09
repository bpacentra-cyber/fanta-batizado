"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const sp = useSearchParams();
  const [status, setStatus] = useState<string>("Sto completando il login...");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // ✅ Caso 1: Supabase manda ?code=... (PKCE)
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          if (!alive) return;
          setStatus("✅ Login completato. Reindirizzo...");
          router.replace("/");
          return;
        }

        // ✅ Caso 2: token in hash (implicit flow) -> getSession lo prende
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!alive) return;

        if (data.session) {
          setStatus("✅ Login completato. Reindirizzo...");
          router.replace("/");
        } else {
          setStatus("❌ Sessione non trovata. Torna al login e riprova.");
          setTimeout(() => router.replace("/login"), 1200);
        }
      } catch (e: any) {
        if (!alive) return;
        setStatus(`❌ Errore callback: ${e?.message ?? "sconosciuto"}`);
        setTimeout(() => router.replace("/login"), 1500);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-center">
        <div className="text-xl font-extrabold">Auth Callback</div>
        <div className="mt-3 text-sm text-white/70">{status}</div>
      </div>
    </div>
  );
}
