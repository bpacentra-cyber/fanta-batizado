"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState("Accesso in corso…");

  useEffect(() => {
    let alive = true;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    async function finalize() {
      try {
        const url = new URL(window.location.href);

        // Supabase a volte manda error_description
        const errorDesc =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error") ||
          "";

        if (errorDesc) throw new Error(decodeURIComponent(errorDesc));

        // ✅ PKCE: code in query
        const code = url.searchParams.get("code");

        // ✅ Fallback: token in hash (#access_token=...)
        const hash = window.location.hash || "";
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        // Proviamo più volte: su iPhone/Android il passaggio Mail->App può abortire la fetch
        const maxTries = 5;

        for (let i = 0; i < maxTries; i++) {
          try {
            if (code) {
              // ✅ IMPORTANTISSIMO: qui va passato SOLO il code
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) throw error;
            } else if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (error) throw error;
            }

            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (data.session) {
              if (!alive) return;
              setStatus("ok");
              setMsg("✅ Login riuscito! Ti porto alla Home…");

              // pulizia URL (evita loop e problemi su mobile)
              window.history.replaceState({}, document.title, "/");

              // vai alla home
              window.location.replace("/");
              return;
            }

            throw new Error("Sessione non creata (tentativo " + (i + 1) + ")");
          } catch (e: any) {
            const m = String(e?.message ?? e);

            // Se è l’errore di abort, riprova
            const isAbort =
              m.toLowerCase().includes("signal is aborted") ||
              m.toLowerCase().includes("abort") ||
              m.toLowerCase().includes("aborted");

            if (i < maxTries - 1 && isAbort) {
              await sleep(350 + i * 250);
              continue;
            }

            throw e;
          }
        }
      } catch (e: any) {
        if (!alive) return;
        setStatus("err");
        setMsg(e?.message ?? "Errore login sconosciuto.");
      }
    }

    finalize();
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
            Se l’errore persiste SOLO da mobile: apri il Magic Link in Safari/Chrome
            (non dentro anteprime/in-app browser) e riprova.
          </div>
        ) : null}
      </div>
    </main>
  );
}
