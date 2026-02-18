"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Scopo:
 * - Quando aprono l'app (anche dopo ore/giorni), se il token è scaduto
 *   prova a refreshare la sessione in automatico.
 * - Su mobile/PWA spesso l'app va in background e i token scadono:
 *   questo evita il "rifai login ogni volta".
 */
export default function AuthBootstrap() {
  useEffect(() => {
    let mounted = true;

    async function ensureSessionFresh() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const session = data.session;

        // se non c'è sessione → niente
        if (!session) return;

        // se c'è sessione ma può essere scaduta / prossima a scadere → refresh
        // (supabase di solito lo fa già, ma su mobile/PWA è più affidabile così)
        await supabase.auth.refreshSession();
      } catch {
        // non blocchiamo nulla
      }
    }

    // 1) all'avvio
    ensureSessionFresh();

    // 2) quando tornano nell'app (tab focus / app foreground)
    const onFocus = () => ensureSessionFresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") ensureSessionFresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
