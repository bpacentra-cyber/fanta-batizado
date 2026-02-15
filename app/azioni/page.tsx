"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AzioneRow = {
  id: string;
  nome: string | null;        // nella tua tabella è il "testo azione" (spesso lungo)
  descrizione: string | null; // spesso NULL
  punti: number | null;
  is_active: boolean | null;
  created_at?: string | null;
};

export default function AzioniPage() {
  const [azioni, setAzioni] = useState<AzioneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // se descrizione è NULL (nella tua tabella lo è spesso), mostriamo "nome"
  const normalized = useMemo(() => {
    return azioni
      .map((a) => ({
        ...a,
        testo: (a.descrizione ?? a.nome ?? "").trim(),
      }))
      .filter((a) => a.testo.length > 0);
  }, [azioni]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      // opzionale ma utile: se la pagina è protetta, qui capisci subito se non sei autenticato
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        // Se vuoi che /azioni sia visibile solo dopo login:
        // puoi anche fare redirect qui verso /login
        // window.location.href = "/login";
        // per ora mostriamo errore leggibile
        if (alive) {
          setLoading(false);
          setErrorMsg("Non sei loggato. Torna su Login e rientra.");
        }
        return;
      }

      const { data, error } = await supabase
        .from("azioni")
        .select("id,nome,descrizione,punti,is_active,created_at")
        .eq("is_active", true) // se non ti serve, rimuovila
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        setErrorMsg(`${error.message}${(error as any)?.details ? " — " + (error as any).details : ""}`);
        setAzioni([]);
      } else {
        setAzioni((data ?? []) as AzioneRow[]);
      }

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight">
            🔥 Azioni
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Leggi bene ogni azione prima di giocare 👇
          </p>
        </header>

        {/* STATO */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
              >
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="mt-3 h-3 w-1/3 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {!loading && errorMsg && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            <div className="font-semibold">Errore nel caricamento delle azioni.</div>
            <div className="mt-2 text-white/80 break-words">
              {errorMsg}
            </div>

            <div className="mt-3 text-white/70">
              Se vedi qualcosa tipo “permission denied” / “RLS”, vai al punto 2 sotto (policy Supabase).
            </div>
          </div>
        )}

        {!loading && !errorMsg && (
          <div className="space-y-3">
            {normalized.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                {/* TESTO AZIONE: niente tagli, va a capo e spezza parole lunghe */}
                <div className="text-base font-semibold leading-relaxed whitespace-normal break-words">
                  {a.testo}
                </div>

                {/* PUNTI */}
                <div className="mt-3 flex items-center justify-between text-sm text-white/70">
                  <span>Punti</span>
                  <span className="font-semibold text-white">
                    {typeof a.punti === "number" ? (a.punti > 0 ? `+${a.punti}` : `${a.punti}`) : "—"}
                  </span>
                </div>
              </article>
            ))}

            {normalized.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Nessuna azione trovata (o tutte vuote).
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
