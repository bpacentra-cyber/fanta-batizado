"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState<string>("Accesso in corso…");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        // 1) Caso PKCE: arriva ?code=...
        const url = window.location.href;
        const hasCode = new URL(url).searchParams.get("code");

        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
        } else {
          // 2) Caso hash: #access_token=... (fallback)
          const hash = window.location.hash || "";
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
          }
        }

        // 3) Verifica sessione finale
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          throw new Error(
            "Sessione non creata. Quasi sempre è un redirect su dominio diverso (controlla NEXT_PUBLIC_SITE_URL e Redirect URLs in Supabase)."
          );
        }

        if (!alive) return;

        setStatus("ok");
        setMsg("✅ Login riuscito! Ti porto alla Home…");

        // IMPORTANTISSIMO: pulisce l’URL (code/hash) e evita loop/abort
        window.history.replaceState({}, document.title, "/");

        // Redirect (usa replace per non tornare alla callback)
        window.location.replace("/");
      } catch (e: any) {
        if (!alive) return;
        setStatus("err");
        setMsg(e?.message ?? "Errore login sconosciuto.");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
        <div className="text-2xl font-extrabold tracking-tight">
          Auth callback
        </div>

        <div
          className={[
            "mt-4 rounded-2xl border p-4 text-sm leading-relaxed",
            status === "err"
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : status === "ok"
              ? "border-green-500/30 bg-green-500/10 text-green-100"
              : "border-white/10 bg-black/30 text-white/80",
          ].join(" ")}
        >
          {status === "err" ? "❌ " : status === "ok" ? "✅ " : "⏳ "}
          {msg}
        </div>

        {status === "err" ? (
          <div className="mt-4 text-xs text-white/60">
            Tip: assicurati che il link del Magic Link punti al dominio production
            (NEXT_PUBLIC_SITE_URL) e che Supabase abbia il redirect /auth/callback
            autorizzato.
          </div>
        ) : null}
      </div>
    </main>
  );
}
