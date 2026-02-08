"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("Sto completando il login…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Supabase OAuth callback: il "code" arriva in querystring
        const code = sp.get("code");

        // Se non c'è code, porta al login
        if (!code) {
          if (!cancelled) router.replace("/login");
          return;
        }

        // Exchange code -> session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        // Vai in home (o profile)
        if (!cancelled) {
          setMsg("Login completato ✅");
          router.replace("/");
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setMsg(`Errore callback: ${e?.message ?? "sconosciuto"}`);
          // fallback al login
          router.replace("/login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="text-lg font-extrabold">Auth Callback</div>
        <div className="mt-2 text-white/70 text-sm">{msg}</div>
      </div>
    </main>
  );
}
