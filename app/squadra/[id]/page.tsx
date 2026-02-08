"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type ProfileRow = {
  user_id: string;
  nome: string | null;
  foto_url: string | null;
  is_admin?: boolean | null;
  is_founder?: boolean | null;
};

type PartecipanteEvento = {
  id: string;
  nome: string;
  costo: number | null;
  foto_url: string | null;
};

type LogAzioneFeed = {
  id: string;
  created_at: string;
  azione_descrizione: string;
  punti: number;
  partecipante_nome: string;
  partecipante_foto_url: string | null;
  nome_squadra: string | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-white/65 leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Avatar({
  url,
  alt,
  size = 44,
  fallback,
}: {
  url: string | null | undefined;
  alt: string;
  size?: number;
  fallback: string;
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

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("it-IT");
  } catch {
    return iso;
  }
}

export default function SquadraDettaglioPage() {
  const router = useRouter();
  const params = useParams();

  const rawId = (params as any)?.id;
  const squadraId = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [squadra, setSquadra] = useState<SquadraRow | null>(null);
  const [capo, setCapo] = useState<ProfileRow | null>(null);
  const [membri, setMembri] = useState<PartecipanteEvento[]>([]);

  const [logAzioni, setLogAzioni] = useState<LogAzioneFeed[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logErr, setLogErr] = useState("");

  const budgetTotale = squadra?.budget_totale ?? 500;
  const budgetSpeso = squadra?.budget_speso ?? 0;
  const budgetRimanente = Math.max(0, budgetTotale - budgetSpeso);

  const costoMembri = useMemo(() => {
    return membri.reduce((acc, m) => acc + (m.costo ?? 0), 0);
  }, [membri]);

  async function loadLogAzioni(idSquadra: string) {
    if (!idSquadra) return;

    setLogLoading(true);
    setLogErr("");

    const { data, error } = await supabase
      .from("v_log_azioni_feed")
      .select(
        "id, created_at, azione_descrizione, punti, partecipante_nome, partecipante_foto_url, nome_squadra"
      )
      .eq("squadra_id", idSquadra)
      .order("created_at", { ascending: false });

    if (error) {
      setLogErr(error.message);
      setLogAzioni([]);
    } else {
      setLogAzioni((data || []) as LogAzioneFeed[]);
    }

    setLogLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      // ✅ evita "invalid uuid: undefined"
      if (!squadraId) return;

      setLoading(true);
      setErr("");

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // 1) Squadra
      const { data: s, error: sErr } = await supabase
        .from("squadre")
        .select(
          "id, nome_squadra, owner_user_id, budget_totale, budget_speso, punteggio, created_at"
        )
        .eq("id", squadraId)
        .single();

      if (!mounted) return;

      if (sErr) {
        setErr(sErr.message);
        setSquadra(null);
        setCapo(null);
        setMembri([]);
        setLoading(false);
        return;
      }

      setSquadra(s as SquadraRow);

      // 2) Caposquadra (profiles)
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, is_admin, is_founder")
        .eq("user_id", (s as SquadraRow).owner_user_id)
        .maybeSingle();

      if (!mounted) return;

      if (pErr) {
        setCapo(null);
      } else {
        setCapo((p || null) as ProfileRow | null);
      }

      // 3) Membri squadra (squadra_membri -> partecipanti_evento)
      const { data: sm, error: smErr } = await supabase
        .from("squadra_membri")
        .select("partecipante_id")
        .eq("squadra_id", squadraId);

      if (!mounted) return;

      if (smErr) {
        setErr(smErr.message);
        setMembri([]);
      } else {
        const ids = (sm || [])
          .map((r: any) => r.partecipante_id)
          .filter(Boolean);

        if (ids.length === 0) {
          setMembri([]);
        } else {
          const { data: pe, error: peErr } = await supabase
            .from("partecipanti_evento")
            .select("id, nome, costo, foto_url")
            .in("id", ids);

          if (!mounted) return;

          if (peErr) {
            setErr(peErr.message);
            setMembri([]);
          } else {
            const list = ((pe || []) as PartecipanteEvento[]).sort((a, b) =>
              a.nome.localeCompare(b.nome, "it")
            );
            setMembri(list);
          }
        }
      }

      // 4) Log azioni feed
      await loadLogAzioni(squadraId);

      if (!mounted) return;
      setLoading(false);
    }

    loadAll();

    return () => {
      mounted = false;
    };
  }, [router, squadraId]);

  const titolo = squadra?.nome_squadra?.trim() || "Squadra";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-4xl px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>Squadra</Badge>
                <Badge>Dettaglio</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {titolo}
              </h1>

              <p className="text-white/70 leading-relaxed">
                Membri, budget e azioni svolte (con punteggi).
              </p>
            </div>

            <div className="flex gap-2">
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
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-4xl px-6 pb-14 space-y-5">
        {!squadraId ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ❌ ID squadra mancante (URL non valido).
          </div>
        ) : null}

        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Caricamento…
          </div>
        ) : (
          <>
            {/* CAPOSQUADRA */}
            <SectionCard
              title="👑 Caposquadra"
              subtitle="La figurina del capitano (foto + nome)."
            >
              <div className="flex items-center gap-4">
                <Avatar
                  url={capo?.foto_url}
                  alt={capo?.nome || "Caposquadra"}
                  size={56}
                  fallback={(capo?.nome || "C")[0]?.toUpperCase() || "C"}
                />
                <div className="min-w-0">
                  <div className="text-lg font-extrabold">{capo?.nome || "—"}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {capo?.is_admin ? <Badge>👑 Admin</Badge> : null}
                    {/* admin NON vede anche founder: questa regola la gestisci altrove, qui mostro solo quello che arriva */}
                    {capo?.is_founder ? <Badge>🫡 Founder</Badge> : null}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* BUDGET */}
            <SectionCard title="💰 Budget" subtitle="Totale, speso, rimanente.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/60 text-xs">Totale</div>
                  <div className="mt-1 text-2xl font-extrabold">
                    {budgetTotale} Dbr
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/60 text-xs">Speso</div>
                  <div className="mt-1 text-2xl font-extrabold">
                    {budgetSpeso} Dbr
                  </div>
                  <div className="mt-1 text-white/55 text-sm">
                    (costo membri: {costoMembri} Dbr)
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/60 text-xs">Rimanente</div>
                  <div className="mt-1 text-2xl font-extrabold text-green-200">
                    {budgetRimanente} Dbr
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* MEMBRI */}
            <SectionCard
              title="👥 Membri"
              subtitle="Lista membri con foto e costo (senza ID)."
              right={
                <Link
                  href="/mercato"
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Vai al Mercato →
                </Link>
              }
            >
              {membri.length === 0 ? (
                <div className="text-white/60">Nessun membro in squadra (ancora).</div>
              ) : (
                <div className="space-y-3">
                  {membri.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            url={m.foto_url}
                            alt={m.nome}
                            size={44}
                            fallback={m.nome?.[0]?.toUpperCase() || "?"}
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold truncate">{m.nome}</div>
                            <div className="text-sm text-white/60">
                              {m.costo ?? 0} Dbr
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-extrabold">
                          {m.costo ?? 0} Dbr
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* AZIONI SVOLTE */}
            <SectionCard
              title="📜 Azioni svolte"
              subtitle="Qui vedi cosa è stato assegnato ai membri di questa squadra (con punteggi)."
              right={
                <button
                  onClick={() => loadLogAzioni(squadraId)}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  ↻ Aggiorna
                </button>
              }
            >
              {logErr ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                  ❌ {logErr}
                </div>
              ) : null}

              {logLoading ? (
                <div className="text-white/70">Caricamento…</div>
              ) : logAzioni.length === 0 ? (
                <div className="text-white/60">
                  Nessuna azione assegnata a questa squadra (per ora 👀).
                </div>
              ) : (
                <div className="space-y-3">
                  {logAzioni.map((r) => {
                    const bonus = r.punti >= 0;
                    return (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-extrabold break-words">
                              {r.azione_descrizione}
                            </div>

                            <div className="mt-2 flex items-center gap-3">
                              <Avatar
                                url={r.partecipante_foto_url}
                                alt={r.partecipante_nome}
                                size={36}
                                fallback={
                                  r.partecipante_nome?.[0]?.toUpperCase() || "?"
                                }
                              />
                              <div className="text-sm text-white/75">
                                👤 <b>{r.partecipante_nome}</b>{" "}
                                <span className="text-white/45">
                                  • {fmtDateTime(r.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            className={[
                              "shrink-0 rounded-2xl px-3 py-2 text-sm font-extrabold border",
                              bonus
                                ? "bg-green-500/10 text-green-200 border-green-500/20"
                                : "bg-red-500/10 text-red-200 border-red-500/20",
                            ].join(" ")}
                          >
                            {bonus ? `+${r.punti}` : r.punti}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* FOOT */}
            <div className="flex items-center justify-between text-xs text-white/45">
              <span>© Fanta Batizado</span>
              <span>App by Instrutor Frodo</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}