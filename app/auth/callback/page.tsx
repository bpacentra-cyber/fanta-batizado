"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        // 👉 recupera sessione dal link
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          return;
        }

        if (!data.session) {
          setError("Sessione non trovata");
          return;
        }

        // 👉 salva sessione localmente (fondamentale per mobile)
        await supabase.auth.setSession(data.session);

        // 👉 redirect
        window.location.href = "/";
      } catch (err: any) {
        setError(err?.message || "Errore login");
      }
    }

    handleAuth();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {error ? (
          <div className="text-red-400">
            ❌ Errore login: {error}
          </div>
        ) : (
          <div>⏳ Accesso in corso...</div>
        )}
      </div>
    </main>
  );
}
