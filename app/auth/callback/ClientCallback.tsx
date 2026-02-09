"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ClientCallback() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    // Se supabase gestisce già la sessione via redirect, qui basta tornare alla home
    // o alla pagina profilo.
    const next = sp.get("next") || "/";
    router.replace(next);
  }, [router, sp]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/80">
        Login completato, ti sto reindirizzando…
      </div>
    </main>
  );
}
