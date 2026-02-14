"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("Sto completando l’accesso…");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Supabase v2: quando torni dal magic link, la sessione viene salvata automaticamente
        // Qui forziamo un check e poi mandiamo l’utente dove serve.
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error) {
          setMsg("Errore sessione: " + error.message);
          return;
        }

        if (data.session?.user) {
          router.replace("/profile");
          return;
        }

        // fallback: se per qualche motivo non c’è sessione, vai al login
        const err = sp.get("error_description") || sp.get("error");
        if (err) setMsg("Errore login: " + err);
        setTimeout(() => router.replace("/login"), 400);
      } catch (e: any) {
        setMsg("Errore inatteso: " + (e?.message || "sconosciuto"));
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, sp]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
        <div className="text-2xl font-extrabold">🔐 Accesso in corso</div>
        <div className="mt-3 text-white/70">{msg}</div>
      </div>
    </main>
  );
}
