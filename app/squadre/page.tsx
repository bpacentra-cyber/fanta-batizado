"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


type SquadraRow = {
  id: string;
  owner_user_id: string;
  nome_squadra: string;
  budget_totale: number;
  budget_speso: number;
  punteggio: number;
};

type ProfileRow = {
  user_id: string;
  nome: string | null;
  foto_url: string | null;
  is_admin: boolean | null;
  is_founder: boolean | null;
};

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "bad" | "gold";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "bad"
      ? "border-red-400/20 bg-red-400/10 text-red-100"
      : tone === "gold"
      ? "border-yellow-300/20 bg-yellow-300/10 text-yellow-100"
      : "border-white/15 bg-white/5 text-white/80";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export default function SquadrePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [squadre, setSquadre] = useState<
    (SquadraRow & {
      capo_nome: string;
      capo_foto: string | null;
      capo_is_admin: boolean;
      capo_is_founder: boolean;
    })[]
  >([]);

  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);
      

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: sRows, error: e1 } = await supabase
        .from("squadre")
        .select("id, owner_user_id, nome_squadra, budget_totale, budget_speso, punteggio")
        .order("created_at", { ascending: true });

      if (e1) {
        setErr(e1.message);
        setLoading(false);
        return;
      }

      const sSafe = (sRows ?? []) as SquadraRow[];
      const ownerIds = [...new Set(sSafe.map((s) => s.owner_user_id))].filter(Boolean);

      const profilesMap = new Map<string, ProfileRow>();
      if (ownerIds.length > 0) {
        const { data: pRows, error: e2 } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url, is_admin, is_founder")
          .in("user_id", ownerIds);

        if (e2) {
          setErr(e2.message);
          setLoading(false);
          return;
        }

        (pRows ?? []).forEach((p: any) => profilesMap.set(p.user_id, p as ProfileRow));
      }

      const merged = sSafe.map((s) => {
        const p = profilesMap.get(s.owner_user_id);
        return {
          ...s,
          capo_nome: p?.nome ?? "Caposquadra",
          capo_foto: p?.foto_url ?? null,
          capo_is_admin: !!p?.is_admin,
          capo_is_founder: !!p?.is_founder,
        };
      });

      setSquadre(merged);
      setLoading(false);
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">👥 Squadre</h1>
            <p className="mt-1 text-white/70">
              Dai pure un'occhiata alle squadre degli altri concorrenti.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              href="/classifica"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10"
            >
              Classifica
            </Link>
            <Link
              href="/mercato"
              className="rounded-xl bg-white px-4 py-2 font-semibold text-black hover:bg-white/90"
            >
              Mercato
            </Link>
          </div>
        </header>

        {loading && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            Carico squadre…
          </div>
        )}

        {!loading && err && (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            Errore: {err}
          </div>
        )}

        {!loading && !err && (
          <div className="mt-8 space-y-3">
            {squadre.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
                Nessuna squadra (ancora). Qualcuno deve avere il coraggio.
              </div>
            ) : (
              squadre.map((s) => {
                const restante = (s.budget_totale ?? 500) - (s.budget_speso ?? 0);

                return (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/squadra/${s.id}`)}
                    className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center shrink-0">
                          {s.capo_foto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.capo_foto}
                              alt="foto caposquadra"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-white/60 text-sm">foto</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-lg font-semibold truncate">{s.nome_squadra}</div>
                          <div className="text-sm text-white/70 truncate">
                            Caposquadra: <b>{s.capo_nome}</b>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {s.capo_is_admin && <Badge tone="gold">👑 Admin Supremo</Badge>}
                            {s.capo_is_founder && <Badge>🧠 Ideatore</Badge>}
                            {restante === 0 && <Badge>🪙 All-in</Badge>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold">{s.punteggio ?? 0} pt</div>
                        <div className="text-sm text-white/70">
                          Budget: {s.budget_speso ?? 0} / {s.budget_totale ?? 500} Dbr
                        </div>
                        <div className="text-sm text-white/70">
                          Restano <b>{restante}</b> Dbr
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-white/50">
          Tip: clicca una squadra per vedere la “figurina” completa + membri.
        </p>
      </div>
    </main>
  );
}
