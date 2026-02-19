"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState("Accesso in corso…");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        // 1) Se Supabase ha già creato sessione (desktop/alcuni browser)
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user) {
          if (!alive) return;
          setStatus("ok");
          setMsg("✅ Sei già loggato. Ti porto alla Home…");
          window.history.replaceState({}, document.title, "/");
          window.location.replace("/");
          return;
        }

        // 2) Leggi token dal fragment (#access_token=...)
        const hash = window.location.hash || "";
        const p = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = p.get("access_token");
        const refresh_token = p.get("refresh_token");

        if (!access_token || !refresh_token) {
          throw new Error(
            "Token mancanti nel link. Apri il Magic Link in Safari/Chrome (non anteprima) e riprova."
          );
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) throw error;

        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) throw new Error("Sessione non creata.");

        if (!alive) return;

        setStatus("ok");
        setMsg("✅ Login riuscito! Ti porto alla Home…");

        // pulizia URL
        window.history.replaceState({}, document.title, "/");

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
        <div className="text-2xl font-extrabold tracking-tight">Auth callback</div>

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
            Se ti apre il link dentro Gmail/WhatsApp: usa “Apri nel browser” (Safari/Chrome).
          </div>
        ) : null}
      </div>
    </main>
  );
}
