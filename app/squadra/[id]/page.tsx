"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function SquadraPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [squadra, setSquadra] = useState<any | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<ProfileMini | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data: s, error: e1 } = await supabase
        .from("squadre")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!mounted) return;

      if (e1) {
        setErrorMsg(e1.message);
        setSquadra(null);
        setOwnerProfile(null);
        setLoading(false);
        return;
      }

      setSquadra(s ?? null);

      const ownerId = getOwnerId(s);
      if (!ownerId) {
        setOwnerProfile(null);
        setLoading(false);
        return;
      }

      const { data: p, error: e2 } = await supabase
        .from("profiles")
        .select("user_id,is_admin,is_founder")
        .eq("user_id", ownerId)
        .maybeSingle();

      if (!mounted) return;

      if (e2) {
        setOwnerProfile(null);
      } else {
        setOwnerProfile((p as ProfileMini) ?? null);
      }

      setLoading(false);
    }

    if (id) load();

    return () => {
      mounted = false;
    };
  }, [id]);

  const nome =
    squadra?.nome ??
    squadra?.name ??
    squadra?.titolo ??
    squadra?.team_name ??
    "Squadra";

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/squadre"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Squadre
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            🏠 Home
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.06] p-4 animate-pulse">
            <div className="h-5 w-2/3 rounded bg-white/10" />
            <div className="mt-3 h-3 w-1/3 rounded bg-white/10" />
          </div>
        ) : errorMsg ? (
          <div className="mt-6 rounded-[22px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            ❌ Errore: <span className="break-words">{errorMsg}</span>
          </div>
        ) : !squadra ? (
          <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-white/75">
            Squadra non trovata.
          </div>
        ) : (
          <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{nome}</h1>
              <RoleChip p={ownerProfile} />
            </div>

            <div className="mt-3 text-sm text-white/75 space-y-1">
              {typeof squadra.budget_residuo !== "undefined" ? (
                <div>💰 Budget residuo: {squadra.budget_residuo}</div>
              ) : null}
              {typeof squadra.budget !== "undefined" ? (
                <div>💰 Budget: {squadra.budget}</div>
              ) : null}
              {typeof squadra.created_at !== "undefined" ? (
                <div className="text-white/55">🕒 Creata: {String(squadra.created_at)}</div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
