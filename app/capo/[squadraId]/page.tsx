"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Squadra = {
  id: string;
  nome_squadra: string;
  owner_user_id: string;
  punteggio: number;
};

type Profile = {
  user_id: string;
  nome: string | null;
  foto_url: string | null;
  is_admin: boolean | null;
};

export default function CapoFigurinaPage() {
  const router = useRouter();
  const params = useParams();
  const squadraId = String(params?.squadraId ?? "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [squadra, setSquadra] = useState<Squadra | null>(null);
  const [capo, setCapo] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.replace("/login");
        return;
      }

      if (!squadraId) {
        setErr("Squadra non valida.");
        setLoading(false);
        return;
      }

      // 1) prendo la squadra
      const { data: s, error: e1 } = await supabase
        .from("squadre")
        .select("id, nome_squadra, owner_user_id, punteggio")
        .eq("id", squadraId)
        .single();

      if (e1) {
        setErr(e1.message);
        setLoading(false);
        return;
      }

      const squadraRow = s as Squadra;
      setSquadra(squadraRow);

      // 2) prendo il profilo caposquadra
      const { data: p, error: e2 } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, is_admin")
        .eq("user_id", squadraRow.owner_user_id)
        .single();

      if (e2) {
        setErr(e2.message);
        setLoading(false);
        return;
      }

      setCapo(p as Profile);
      setLoading(false);
    };

    load();
  }, [router, squadraId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6 flex items-center justify-center">
        Caricamento figurina…
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6">
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
        >
          ← Indietro
        </button>
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          Errore: {err}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
          >
            ← Indietro
          </button>
          {squadra?.id && (
            <button
              onClick={() => router.push(`/squadra/${squadra.id}`)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
            >
              Vai alla Squadra
            </button>
          )}
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
              {capo?.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={capo.foto_url} alt="foto caposquadra" className="h-full w-full object-cover" />
              ) : (
                <span className="text-white/60 text-sm">foto</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm text-white/70">CAPOSQUADRA</div>
              <h1 className="text-2xl font-extrabold tracking-tight truncate">
                {capo?.nome ?? "Senza Nome (ma con stile)"}
              </h1>
              <div className="mt-1 text-white/70 text-sm">
                Squadra: <b className="text-white">{squadra?.nome_squadra}</b>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-white/70 text-sm">Punti</div>
              <div className="text-3xl font-bold">{squadra?.punteggio ?? 0}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-white/70 text-sm">Titolo</div>
              <div className="text-lg font-semibold">
                {capo?.is_admin ? "👑 Admin Supremo" : "🔥 Guerriero/a da Roda"}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-white/80">
            <div className="text-sm text-white/70">Bio (goliardica)</div>
            <div className="mt-1">
              “Se perdo è colpa del budget. Se vinco è talento.” 😎
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}