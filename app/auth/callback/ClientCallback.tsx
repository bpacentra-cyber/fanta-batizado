"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Se Supabase ti rimanda con ?code=..., scambiamo il code con la sessione
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // fallback: prova comunque a leggere la sessione
          await supabase.auth.getSession();
        }

        if (!cancelled) router.replace("/");
      } catch (e) {
        // anche se fallisce, non blocchiamo il deploy: mandiamo al login
        if (!cancelled) router.replace("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="min-h-screen grid place-items-center text-white">
      Accesso in corso…
    </div>
  );
}
