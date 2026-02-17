"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProfileMini = {
  user_id: string;
  is_admin: boolean | null;
  is_founder: boolean | null;
};

function RoleChip({ p }: { p?: ProfileMini | null }) {
  const isAdmin = !!p?.is_admin;
  const isFounder = !!p?.is_founder;

  if (isAdmin) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] font-extrabold text-amber-100">
        👑 ADMIN
      </span>
    );
  }
  if (isFounder) {
    return (
      <span className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[11px] font-extrabold text-green-100">
        🔥 FOUNDERS
      </span>
    );
  }
  return null;
}

function getOwnerId(row: any): string | null {
  return (
    row?.user_id ??
    row?.owner_id ??
    row?.created_by ??
    row?.creator_id ??
    row?.capitano_id ??
    null
  );
}

export default function SquadrePage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [profilesByUser, setProfilesByUser] = useState<Record<string, ProfileMini>>(
    {}
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");

      // 1) carica squadre (adatta select se hai colonne diverse: qui lasciamo ampio)
      const { data: s, error: e1 } = await supabase
        .from("squadre")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (e1) {
        setErrorMsg(e1.message);
        setRows([]);
        setProfilesByUser({});
        setLoading(false);
        return;
      }

      const squadre = (s ?? []) as any[];
      setRows(squadre);

      // 2) raccogli owner ids
      const ownerIds = Array.from(
        new Set(squadre.map(getOwnerId).filter(Boolean))
      ) as string[];

      if (ownerIds.length === 0) {
        setProfilesByUser({});
        setLoading(false);
        return;
      }

      // 3) carica profili per badge
      const { data: p, error: e2 } = await supabase
        .from("profiles")
        .select("user_id,is_admin,is_founder")
        .in("user_id", ownerIds);

      if (!mounted) return;

      if (e2) {
        // non blocchiamo la pagina: solo niente badge
        setProfilesByUser({});
        setLoading(false);
        return;
      }

      const map: Record<string, ProfileMini> = {};
      (p ?? []).forEach((x) => {
        map[x.user_id] = x as ProfileMini;
      });

      setProfilesByUser(map);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 animate-pulse"
            >
              <div className="h-4 w-2/3 rounded bg-white/10" />
              <div className="mt-3 h-3 w-1/3 rounded bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="rounded-[22px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          ❌ Errore nel caricamento squadre: <span className="break-words">{errorMsg}</span>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-white/75">
          Nessuna squadra trovata (ancora).
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {rows.map((r) => {
          const id = r.id ?? r.squadra_id ?? r.uuid ?? "";
          const nome =
            r.nome ??
            r.name ??
            r.titolo ??
            r.team_name ??
            "Squadra senza nome";

          const ownerId = getOwnerId(r);
          const prof = ownerId ? profilesByUser[ownerId] : null;

          return (
            <Link
              key={String(id) + String(nome)}
              href={`/squadra/${id}`}
              className="block rounded-[22px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur transition hover:bg-white/[0.10]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-extrabold tracking-tight truncate">
                      {nome}
                    </div>
                    <RoleChip p={prof} />
                  </div>

                  {/* Sotto: info secondarie se esistono */}
                  <div className="mt-1 text-sm text-white/65">
                    {typeof r.budget_residuo !== "undefined"
                      ? `Budget residuo: ${r.budget_residuo}`
                      : typeof r.budget !== "undefined"
                      ? `Budget: ${r.budget}`
                      : null}
                  </div>
                </div>

                <div className="text-white/35 text-sm">→</div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }, [loading, errorMsg, rows, profilesByUser]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
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
          Qui vedi tutte le squadre. I badge (👑 Admin / 🔥 Founders) sono visibili a tutti.
        </p>

        <div className="mt-6">{content}</div>
      </div>
    </main>
  );
}
