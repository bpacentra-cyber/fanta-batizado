"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AzioneRow = {
  id: number;
  // alcune DB hanno "azione", altre "descrizione"
  azione?: string | null;
  descrizione?: string | null;
};

export default function AzioniPage() {
  const [rows, setRows] = useState<AzioneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      // Prendiamo ENTRAMBI i campi, così non ti escono card vuote
      const { data, error } = await supabase
        .from("azioni")
        .select("id, azione, descrizione")
        .order("id", { ascending: true });

      if (!alive) return;

      if (error) {
        console.error("Errore azioni:", error);
        setErr("Errore nel caricamento delle azioni.");
        setRows([]);
        setLoading(false);
        return;
      }

      setRows((data || []) as AzioneRow[]);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const azioni = useMemo(() => {
    // scegliamo il testo migliore ed eliminiamo righe vuote
    return (rows || [])
      .map((r) => {
        const text = (r.descrizione ?? r.azione ?? "").trim();
        return { id: r.id, text };
      })
      .filter((x) => x.text.length > 0);
  }, [rows]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[720px] px-4 py-6 sm:px-6">
        {/* Header pulito (stile “prima”) */}
        <div className="mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight">
            🔥 Azioni
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Leggi bene ogni azione prima di giocare 👇
          </p>
          {!loading && !err && (
            <p className="mt-2 text-xs text-white/40">
              Totale: {azioni.length}
            </p>
          )}
        </div>

        {/* Stato errore */}
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Skeleton solo mentre carica */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[64px] rounded-2xl border border-white/10 bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !err && azioni.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            Nessuna azione trovata (o il campo è vuoto in tabella).
          </div>
        )}

        {/* Lista azioni “app-like” */}
        {!loading && !err && azioni.length > 0 && (
          <div className="space-y-3">
            {azioni.map((a, idx) => (
              <div
                key={a.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* badge numerino */}
                  <div className="mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/80">
                    {idx + 1}
                  </div>

                  {/* testo: NO tagli, va a capo anche con parole lunghe */}
                  <p className="text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap break-words">
                    {a.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
