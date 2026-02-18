"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SquadraRow = {
  id: string;
  nome_squadra: string | null;
  owner_user_id: string;
  budget_totale: number | null;
  budget_speso: number | null;
  punteggio: number | null;
  created_at?: string;
};

type ProfileMini = {
  user_id: string;
  nome: string | null;
  foto_url: string | null;
  is_admin: boolean | null;
  is_founder: boolean | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

function Avatar({
  url,
  alt,
  fallback,
  size = 44,
}: {
  url: string | null | undefined;
  alt: string;
  fallback: string;
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30"
      style={{ width: size, height: size }}
      title={alt}
    >
      {url ? (
        <Image src={url} alt={alt} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/70 font-extrabold">
          {fallback}
        </div>
      )}
      <div className="absolute inset-0 bg-black/15" />
    </div>
  );
}

export default function SquadrePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<SquadraRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});

  async function load() {
    setErr("");
    setLoading(true);

    // (manteniamo lo stesso comportamento tipico dell’app: se non sei loggato -> login)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      router.replace("/login");
      return;
    }

    // 1) squadre
    const { data, error } = await supabase
      .from("squadre")
      .select("id, nome_squadra, owner_user_id, budget_totale, budget_speso, punteggio, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setRows([]);
      setProfiles({});
      setLoading(false);
      return;
    }

    const list = (data || []) as SquadraRow[];
    setRows(list);

    // 2) profili capi squadra (per badge)
    const ownerIds = Array.from(new Set(list.map((s) => s.owner_user_id).filter(Boolean)));
    if (ownerIds.length === 0) {
      setProfiles({});
      setLoading(false);
      return;
    }

    const { data: pData, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, nome, foto_url, is_admin, is_founder")
      .in("user_id", ownerIds);

    if (pErr) {
      // non blocchiamo la pagina se i profili non sono disponibili
      setProfiles({});
    } else {
      const map: Record<string, ProfileMini> = {};
      for (const p of (pData || []) as ProfileMini[]) {
        map[p.user_id] = p;
      }
      setProfiles(map);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = useMemo(() => {
    return rows.map((s) => {
      const capo = profiles[s.owner_user_id];
      const capoNome = capo?.nome?.trim() || "Caposquadra";
      const squadraNome = s.nome_squadra?.trim() || "Squadra";
      const fallback = (capoNome[0] || "S").toUpperCase();

      const budgetTot = s.budget_totale ?? 500;
      const budgetSpeso = s.budget_speso ?? 0;
      const budgetRem = Math.max(0, budgetTot - budgetSpeso);

      const isAdmin = !!capo?.is_admin;
      const isFounder = !!capo?.is_founder;

      return {
        s,
        capoNome,
        squadraNome,
        fallback,
        budgetTot,
        budgetSpeso,
        budgetRem,
        isAdmin,
        isFounder,
        foto: capo?.foto_url ?? null,
      };
    });
  }, [rows, profiles]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>👥 Squadre</Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Squadre
              </h1>
              <p className="text-white/70 leading-relaxed">
                Qui vedi tutte le squadre create (con badge Admin / Founder sul caposquadra).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                ← Home
              </Link>
              <button
                onClick={load}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                ↻ Aggiorna
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-5xl px-6 pb-14 space-y-5">
        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Caricamento…
          </div>
        ) : content.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Nessuna squadra (ancora).
          </div>
        ) : (
          <div className="space-y-3">
            {content.map((x) => (
              <Link
                key={x.s.id}
                href={`/squadra/${x.s.id}`}
                className="block rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur hover:bg-white/[0.10] transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xl font-extrabold tracking-tight truncate">
                      {x.squadraNome}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <Avatar url={x.foto} alt={x.capoNome} fallback={x.fallback} />
                      <div className="min-w-0">
                        <div className="text-sm text-white/75 truncate">
                          Capo: <b className="text-white">{x.capoNome}</b>
                        </div>

                        {/* ✅ QUI: BADGE VISIBILI A TUTTI */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {x.isAdmin ? <Badge>👑 Admin</Badge> : null}
                          {!x.isAdmin && x.isFounder ? <Badge>⭐ Founder</Badge> : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-white/55">
                      Budget: {x.budgetSpeso}/{x.budgetTot} • Rimanente:{" "}
                      <span className="text-green-200 font-bold">{x.budgetRem}</span>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-extrabold">
                    {x.s.punteggio ?? 0} pt
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </div>
    </main>
  );
}