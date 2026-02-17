"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Squadra = {
  id: string;
  nome_squadra: string;
  owner_user_id: string;
};

type Profile = {
  user_id: string;
  is_admin: boolean;
  is_founder: boolean;
};

export default function SquadrePage() {
  const [squadre, setSquadre] = useState<Squadra[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");

      // 1. prendi squadre
      const { data: squadreData, error: err1 } = await supabase
        .from("squadre")
        .select("id, nome_squadra, owner_user_id")
        .order("nome_squadra");

      if (err1) {
        setErrorMsg(err1.message);
        setLoading(false);
        return;
      }

      // 2. prendi profili
      const { data: profiliData, error: err2 } = await supabase
        .from("profiles")
        .select("user_id, is_admin, is_founder");

      if (err2) {
        setErrorMsg(err2.message);
        setLoading(false);
        return;
      }

      // 3. crea mappa user_id -> profilo
      const map: Record<string, Profile> = {};
      (profiliData || []).forEach((p) => {
        map[p.user_id] = p;
      });

      if (!mounted) return;

      setSquadre(squadreData || []);
      setProfiles(map);
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">👥 Squadre</h1>

          <Link
            href="/"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Home
          </Link>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-6 text-white/60">Caricamento...</div>
        )}

        {/* ERRORE */}
        {!loading && errorMsg && (
          <div className="mt-6 text-red-400">{errorMsg}</div>
        )}

        {/* LISTA */}
        {!loading && !errorMsg && (
          <div className="mt-6 space-y-3">
            {squadre.map((s) => {
              const profile = profiles[s.owner_user_id];

              return (
                <Link
                  key={s.id}
                  href={`/squadra/${s.id}`}
                  className="block rounded-[22px] border border-white/10 bg-white/[0.06] p-4 hover:bg-white/[0.10]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-lg">
                        {s.nome_squadra}
                      </div>

                      {/* BADGE */}
                      <div className="mt-1 flex gap-2">
                        {profile?.is_admin && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300">
                            👑 Admin
                          </span>
                        )}

                        {profile?.is_founder && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-300">
                            🔥 Founder
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-white/40">→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
