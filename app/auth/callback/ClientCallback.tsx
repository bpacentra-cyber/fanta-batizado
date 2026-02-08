"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const [msg, setMsg] = useState("🔄 Sto completando il login…");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        // In molti setup Supabase fa già la sessione “da solo” quando
        // arriva il callback (cookie / code exchange). Qui facciamo solo:
        // 1) refresh session
        // 2) se ok -> redirect alla home (o /profile)
        const { data, error } = await supabase.auth.getSession();

        if (!alive) return;

        if (error) {
          setMsg(`❌ Errore sessione: ${error.message}`);
          return;
        }

        if (!data.session?.user) {
          // Non c’è sessione: rimando al login
          setMsg("❌ Login non completato. Torno al login…");
          setTimeout(() => router.replace("/login"), 700);
          return;
        }

        setMsg("✅ Login completato! Ti mando alla Home…");
        setTimeout(() => router.replace("/"), 400);
      } catch (e: any) {
        if (!alive) return;
        setMsg(`❌ Errore inatteso: ${e?.message ?? "sconosciuto"}`);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-center">
        <div className="text-xl font-extrabold">Auth Callback</div>
        <div className="mt-3 text-white/75">{msg}</div>
      </div>
    </main>
  );
}
