"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type ClassificaRow = {
  squadra_id: string;
  nome_squadra: string | null;
  owner_user_id: string;

  capo_nome: string | null;
  capo_foto_url: string | null;
  capo_is_admin: boolean | null;
  capo_is_founder: boolean | null;

  punti_totali: number;
  numero_azioni: number;
  ultima_azione_at: string | null;
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
  size = 46,
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

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("it-IT");
  } catch {
    return "—";
  }
}

export default function ClassificaPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<ClassificaRow[]>([]);
  const channelsRef = useRef<any[]>([]);

  async function load() {
    setErr("");
    setLoading(true);

    const { data, error } = await supabase
      .from("v_classifica_squadre")
      .select(
        "squadra_id, nome_squadra, owner_user_id, capo_nome, capo_foto_url, capo_is_admin, capo_is_founder, punti_totali, numero_azioni, ultima_azione_at"
      )
      .order("punti_totali", { ascending: false })
      .order("numero_azioni", { ascending: false })
      .order("nome_squadra", { ascending: true });

    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data || []) as ClassificaRow[]);
    }

    setLoading(false);
  }

  function teardownRealtime() {
    for (const ch of channelsRef.current) {
      try {
        supabase.removeChannel(ch);
      } catch {}
    }
    channelsRef.current = [];
  }

  function setupRealtime() {
    teardownRealtime();

    const tables = ["log_azioni", "azioni", "squadra_membri", "squadre", "profiles"] as const;

    for (const t of tables) {
      const ch = supabase
        .channel(`rt:classifica:${t}`)
        .on("postgres_changes", { event: "*", schema: "public", table: t }, () => {
          load();
        })
        .subscribe();

      channelsRef.current.push(ch);
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      await load();
      if (!mounted) return;
      setupRealtime();
    })();

    return () => {
      mounted = false;
      teardownRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

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
                <Badge>🏆 Classifica</Badge>
                <Badge>Realtime</Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Ranking Squadre
              </h1>
              <p className="text-white/70 leading-relaxed">
                Punteggio calcolato automaticamente dalle azioni assegnate ai membri delle squadre.
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
      <div className="mx-auto w-full max-w-5xl px-6 pb-14 space-y-6">
        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Caricamento…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Nessuna squadra (ancora). Appena qualcuno crea la sua squadra, compare qui.
          </div>
        ) : (
          <>
            {/* PODIO */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">🥇 Podio</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Anche se siete in 2, il podio esiste lo stesso. Non discutiamo.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {podium.map((r, idx) => {
                  const pos = idx + 1;
                  const capoNome = r.capo_nome || "Caposquadra";
                  const squadraNome = r.nome_squadra?.trim() || "Squadra";
                  const fallback = (capoNome[0] || "S").toUpperCase();

                  return (
                    <Link
                      key={r.squadra_id}
                      href={`/squadra/${r.squadra_id}`}
                      className="rounded-3xl border border-white/10 bg-black/30 p-5 hover:bg-black/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-extrabold">
                          {pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉"}
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-sm font-extrabold">
                          {r.punti_totali} pt
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <Avatar url={r.capo_foto_url} alt={capoNome} fallback={fallback} />
                        <div className="min-w-0">
                          <div className="font-extrabold truncate">{squadraNome}</div>
                          <div className="text-sm text-white/65 truncate">Capo: {capoNome}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {r.capo_is_admin ? <Badge>👑 Admin</Badge> : null}
                            {!r.capo_is_admin && r.capo_is_founder ? <Badge>🫡 Founder</Badge> : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-white/55">
                        Azioni: {r.numero_azioni} • Ultima: {fmtDate(r.ultima_azione_at)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* RANKING COMPLETO - SEMPRE VISIBILE */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
              <h2 className="text-xl font-extrabold tracking-tight">📋 Ranking completo</h2>
              <p className="mt-1 text-sm text-white/65">
                Tutte le squadre. Quando sarete in 16, qui sotto inizia la guerra vera.
              </p>

              {rest.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
                  Nessuna squadra fuori dal podio… per ora 👀
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {rest.map((r, i) => {
                    const pos = i + 4;
                    const capoNome = r.capo_nome || "Caposquadra";
                    const squadraNome = r.nome_squadra?.trim() || "Squadra";
                    const fallback = (capoNome[0] || "S").toUpperCase();

                    return (
                      <Link
                        key={r.squadra_id}
                        href={`/squadra/${r.squadra_id}`}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40 transition flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 text-center font-extrabold text-white/70">
                            #{pos}
                          </div>
                          <Avatar url={r.capo_foto_url} alt={capoNome} fallback={fallback} size={40} />
                          <div className="min-w-0">
                            <div className="font-extrabold truncate">{squadraNome}</div>
                            <div className="text-sm text-white/65 truncate">Capo: {capoNome}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-sm font-extrabold">
                            {r.punti_totali} pt
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <div className="flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </div>
    </main>
  );
}
