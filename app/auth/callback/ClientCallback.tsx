"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback({
  code,
  nextUrl,
}: {
  code: string;
  nextUrl: string;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("Sto completando il login…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (!code) {
          setMsg("❌ Codice mancante. Riprova dal login.");
          router.replace("/login");
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMsg("❌ Errore login: " + error.message);
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          router.replace(nextUrl || "/");
          router.refresh();
        }
      } catch (e: any) {
        setMsg("❌ Errore inatteso: " + (e?.message ?? "sconosciuto"));
        router.replace("/login");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code, nextUrl, router]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="text-lg font-extrabold">Auth Callback</div>
        <div className="mt-2 text-white/70 text-sm">{msg}</div>
      </div>
    </main>
  );
}
