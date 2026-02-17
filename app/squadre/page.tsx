"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Squadra = {
  id: string;
  nome: string;
};

export default function SquadrePage() {
  const [squadre, setSquadre] = useState<Squadra[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("squadre")
        .select("id, nome")
        .order("nome", { ascending: true });

      if (!mounted) return;

      if (error) {
        setErrorMsg(error.message);
        setSquadre([]);
      } else {
        setSquadre(data || []);
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">👥 Squadre</h1>

          <Link
            href="/"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Home
          </Link>
        </div>

        <p className="mt-2 text-sm text-white/70">
          Visualizza tutte le squadre partecipanti.
        </p>

        {/* LOADING */}
        {loading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 animate-pulse"
              >
                <div className="h-4 w-2/3 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* ERRORE */}
        {!loading && errorMsg && (
          <div className="mt-6 rounded-[22px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            ❌ Errore nel caricamento: {errorMsg}
          </div>
        )}

        {/* LISTA */}
        {!loading && !errorMsg && (
          <div className="mt-6 space-y-3">
            {squadre.map((s) => (
              <Link
                key={s.id}
                href={`/squadra/${s.id}`}
                className="block rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur transition hover:bg-white/[0.10]"
              >
                <div className="flex items-center justify-between">
                  <div className="text-base font-extrabold tracking-tight">
                    {s.nome}
                  </div>

                  <div className="text-white/35 text-sm">→</div>
                </div>
              </Link>
            ))}

            {squadre.length === 0 && (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-white/70">
                Nessuna squadra trovata.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
