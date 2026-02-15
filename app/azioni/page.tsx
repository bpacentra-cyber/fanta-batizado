"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Azione = {
  id: number;
  descrizione: string;
};

export default function AzioniPage() {
  const [azioni, setAzioni] = useState<Azione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("azioni")
        .select("id, descrizione")
        .order("id", { ascending: true });

      if (error) {
        console.error("Errore azioni:", error);
      } else {
        setAzioni(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-md mx-auto">

        {/* TITOLO */}
        <h1 className="text-2xl font-bold mb-2">🔥 Azioni</h1>
        <p className="text-sm text-white/60 mb-5">
          Leggi bene ogni azione prima di giocare 👇
        </p>

        {/* LOADING */}
        {loading && (
          <p className="text-white/60">Caricamento...</p>
        )}

        {/* LISTA */}
        <div className="flex flex-col gap-3">
          {azioni.map((a) => (
            <div
              key={a.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className="text-base leading-relaxed break-words whitespace-pre-wrap">
                {a.descrizione}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
