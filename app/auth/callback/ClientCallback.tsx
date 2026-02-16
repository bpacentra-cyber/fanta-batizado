"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function run() {
      // Gestisce automaticamente la sessione dal link (detectSessionInUrl)
      await supabase.auth.getSession();

      if (!mounted) return;

      // Vai SEMPRE alla home aggiornata
      router.replace("/");
    }

    run();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/80">
        Accesso in corso…
      </div>
    </div>
  );
}
