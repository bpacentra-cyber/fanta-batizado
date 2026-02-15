"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Azione = {
  id: string | number;
  descrizione: string | null;
  // altri campi ignorati volutamente (es. codice, punti, ecc.)
};

export default function AzioniPage() {
  const [azioni, setAzioni] = useState<Azione[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // In caso la descrizione contenga spazi/righe strane, la rendiamo sempre stringa
  const safeAzioni = useMemo(
    () =>
      azioni.map((a) => ({
        ...a,
        descrizione: (a.descrizione ?? "").trim(),
      })),
    [azioni]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAzioni() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const { data, error } = await supabase
          .from("azioni")
          .select("id, descrizione")
          .order("id", { ascending: true });

        if (error) throw error;

        if (isMounted) {
          setAzioni((data ?? []) as Azione[]);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message ?? "Errore nel caricamento delle azioni");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAzioni();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          🔥 Azioni
        </h1>
        <p className="text-white/70 mt-1 text-sm">
          Scegli l’azione e leggi bene la descrizione 👇
        </p>

        <div className="mt-5">
          {loading && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/70">Caricamento azioni…</p>
            </div>
          )}

          {!loading && errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-red-200 font-semibold">Errore</p>
              <p className="text-red-200/80 text-sm mt-1 break-words">
                {errorMsg}
              </p>
              <p className="text-white/60 text-xs mt-3">
                Controlla che la tabella Supabase si chiami <b>azioni</b> e che
                abbia la colonna <b>descrizione</b>.
              </p>
            </div>
          )}

          {!loading && !errorMsg && safeAzioni.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/70">
                Nessuna azione trovata. (Tabella vuota)
              </p>
            </div>
          )}

          {!loading && !errorMsg && safeAzioni.length > 0 && (
            <div className="space-y-3">
              {safeAzioni.map((azione) => (
                <div
                  key={azione.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-[0.99] transition"
                >
                  <p className="text-base leading-relaxed whitespace-pre-line break-words">
                    {azione.descrizione}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-xs text-white/40">
          Tip: se una descrizione è molto lunga, ora va a capo e resta sempre
          leggibile ✅
        </div>
      </div>
    </div>
  );
}
