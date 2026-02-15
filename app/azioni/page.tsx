"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";


type AzioneRow = {
  id: string;
  nome: string | null;
  descrizione: string | null;
  punti: number | null;
  is_active: boolean | null;
};

export default function AzioniPage() {
  const [azioni, setAzioni] = useState<AzioneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("azioni")
        .select("id,nome,descrizione,punti,is_active")
        .eq("is_active", true)
        .order("punti", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Errore Supabase azioni:", error);
        setErrorMsg(
          `Errore nel caricamento delle azioni: ${error.message} (code: ${error.code ?? "n/a"})`
        );
        setAzioni([]);
      } else {
        setAzioni((data ?? []) as AzioneRow[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return azioni;

    return azioni.filter((a) => {
      const titolo = (a.nome ?? "").toLowerCase();
      const desc = (a.descrizione ?? "").toLowerCase();
      return titolo.includes(s) || desc.includes(s);
    });
  }, [azioni, q]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-8">
        {/* Header */}
        <header className="mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight">
            🔥 Azioni
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Leggi bene ogni azione prima di giocare 👇
          </p>

          {/* Search */}
          <div className="mt-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca un’azione…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none placeholder:text-white/40 focus:border-white/30"
            />
            <p className="mt-2 text-xs text-white/50">
              Tip: cerca per parole (es. “corda”, “roda”, “canta”…)
            </p>
          </div>
        </header>

        {/* Error */}
        {!loading && errorMsg && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="font-semibold">Errore nel caricamento</div>
            <div className="mt-2 text-sm text-white/80 break-words">
              {errorMsg}
            </div>
            <div className="mt-3 text-xs text-white/60">
              Se l’errore è tipo “permission denied / RLS”, devi aggiungere la policy
              SELECT sulla tabella <b>public.azioni</b> (ti scrivo sotto esattamente come).
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
              >
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="mt-3 h-4 w-full rounded bg-white/10" />
                <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {!loading && !errorMsg && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
                Nessuna azione trovata.
              </div>
            ) : (
              filtered.map((a) => {
                const titolo = a.nome?.trim() || "Azione";
                const descr = a.descrizione?.trim();
                const punti = a.punti ?? 0;

                return (
                  <article
                    key={a.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold leading-snug break-words">
                          {titolo}
                        </h2>
                        {descr ? (
                          <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap break-words leading-relaxed">
                            {descr}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-white/50">
                            (Nessuna descrizione)
                          </p>
                        )}
                      </div>

                      <div
                        className={[
                          "shrink-0 rounded-full px-3 py-1 text-sm font-semibold",
                          punti >= 0
                            ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/20"
                            : "bg-rose-500/15 text-rose-200 border border-rose-500/20",
                        ].join(" ")}
                      >
                        {punti >= 0 ? `+${punti}` : punti}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
