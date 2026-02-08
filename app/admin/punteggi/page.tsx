"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  user_id: string;
  nome: string | null;
  foto_url: string | null;
  is_admin: boolean | null;
  is_founder: boolean | null;
};

type SquadraRow = {
  id: string;
  nome_squadra: string | null;
  owner_user_id: string;
};

type SquadraMembroRow = {
  squadra_id: string;
  partecipante_id: string;
};

type PartecipanteEventoRow = {
  id: string;
  nome: string | null;
  foto_url: string | null;
  costo: number | null;
};

type AzioneRow = {
  id: string;
  codice: string | null;
  nome: string | null;
  descrizione: string | null;
  punti: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

type LogAzioneRow = {
  id: string;
  azione_id: string | null;
  partecipante_id: string | null; // ✅ nel tuo DB è partecipante_id
  created_by: string | null;
  created_at: string | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red";
}) {
  const cls =
    tone === "green"
      ? "border-green-500/25 bg-green-500/10 text-green-200"
      : tone === "red"
      ? "border-red-500/25 bg-red-500/10 text-red-200"
      : "border-white/15 bg-white/5 text-white/80";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${cls}`}
    >
      {children}
    </span>
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

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("it-IT");
  } catch {
    return "—";
  }
}

export default function AdminPunteggiPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [me, setMe] = useState<ProfileRow | null>(null);
  const isAdmin = !!me?.is_admin;

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [squadre, setSquadre] = useState<SquadraRow[]>([]);
  const [squadraMembri, setSquadraMembri] = useState<SquadraMembroRow[]>([]);
  const [partecipanti, setPartecipanti] = useState<PartecipanteEventoRow[]>([]);
  const [azioni, setAzioni] = useState<AzioneRow[]>([]);
  const [logAzioni, setLogAzioni] = useState<LogAzioneRow[]>([]);

  const [selectedPartecipanteId, setSelectedPartecipanteId] = useState<string>("");
  const [selectedAzioneId, setSelectedAzioneId] = useState<string>("");

  const channelsRef = useRef<any[]>([]);

  const mapProfile = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    for (const p of profiles) m.set(p.user_id, p);
    return m;
  }, [profiles]);

  const mapSquadra = useMemo(() => {
    const m = new Map<string, SquadraRow>();
    for (const s of squadre) m.set(s.id, s);
    return m;
  }, [squadre]);

  const mapAzione = useMemo(() => {
    const m = new Map<string, AzioneRow>();
    for (const a of azioni) m.set(a.id, a);
    return m;
  }, [azioni]);

  const mapPartecipante = useMemo(() => {
    const m = new Map<string, PartecipanteEventoRow>();
    for (const p of partecipanti) m.set(p.id, p);
    return m;
  }, [partecipanti]);

  // partecipante_id -> squadra_id (se un partecipante è in più squadre, prendiamo la prima trovata)
  const mapPartecipanteToSquadra = useMemo(() => {
    const m = new Map<string, string>();
    for (const sm of squadraMembri) {
      if (!m.has(sm.partecipante_id)) m.set(sm.partecipante_id, sm.squadra_id);
    }
    return m;
  }, [squadraMembri]);

  const selectedAzione = useMemo(
    () => (selectedAzioneId ? mapAzione.get(selectedAzioneId) : undefined),
    [selectedAzioneId, mapAzione]
  );

  const selectedPartecipante = useMemo(
    () => (selectedPartecipanteId ? mapPartecipante.get(selectedPartecipanteId) : undefined),
    [selectedPartecipanteId, mapPartecipante]
  );

  const puntiDerivati = useMemo(() => {
    const p = selectedAzione?.punti;
    return typeof p === "number" ? p : 0;
  }, [selectedAzione]);

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
    const tables = ["log_azioni", "azioni", "squadra_membri", "squadre", "partecipanti_evento", "profiles"] as const;

    for (const t of tables) {
      const ch = supabase
        .channel(`rt:admin-punteggi:${t}`)
        .on("postgres_changes", { event: "*", schema: "public", table: t }, () => {
          loadAll();
        })
        .subscribe();

      channelsRef.current.push(ch);
    }
  }

  async function loadAll() {
    setErr(null);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // ME (admin?)
      const { data: meRow, error: meErr } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, is_admin, is_founder")
        .eq("user_id", user.id)
        .maybeSingle();

      if (meErr) throw meErr;
      setMe((meRow || null) as ProfileRow | null);

      // PROFILES (per mostrare nome caposquadra nel feed)
      const { data: pr, error: prErr } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, is_admin, is_founder");

      if (prErr) throw prErr;
      setProfiles((pr || []) as ProfileRow[]);

      // SQUADRE
      const { data: sq, error: sqErr } = await supabase
        .from("squadre")
        .select("id, nome_squadra, owner_user_id")
        .order("created_at", { ascending: true });

      if (sqErr) throw sqErr;
      setSquadre((sq || []) as SquadraRow[]);

      // SQUADRA_MEMBRI
      const { data: sm, error: smErr } = await supabase
        .from("squadra_membri")
        .select("squadra_id, partecipante_id");

      if (smErr) throw smErr;
      setSquadraMembri((sm || []) as SquadraMembroRow[]);

      // PARTECIPANTI_EVENTO (membri acquistabili + a cui assegni azioni)
      const { data: pe, error: peErr } = await supabase
        .from("partecipanti_evento")
        .select("id, nome, foto_url, costo")
        .order("nome", { ascending: true });

      if (peErr) throw peErr;
      setPartecipanti((pe || []) as PartecipanteEventoRow[]);

      // AZIONI (tutte, anche inattive: nel dropdown mostriamo solo active)
      const { data: az, error: azErr } = await supabase
        .from("azioni")
        .select("id, codice, nome, descrizione, punti, is_active, created_at")
        .order("is_active", { ascending: false })
        .order("punti", { ascending: false })
        .order("nome", { ascending: true });

      if (azErr) throw azErr;
      setAzioni((az || []) as AzioneRow[]);

      // LOG_AZIONI (ultime 200)
      const { data: lg, error: lgErr } = await supabase
        .from("log_azioni")
        .select("id, azione_id, partecipante_id, created_by, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (lgErr) throw lgErr;
      setLogAzioni((lg || []) as LogAzioneRow[]);

      // default selezioni
      const firstP = (pe as any[])?.[0]?.id;
      const firstA = (az as any[])?.find((x: any) => x?.is_active === true)?.id ?? (az as any[])?.[0]?.id;

      setSelectedPartecipanteId((prev) => prev || firstP || "");
      setSelectedAzioneId((prev) => prev || firstA || "");
    } catch (e: any) {
      setErr(e?.message ?? "Errore sconosciuto.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      await loadAll();
      if (!mounted) return;
      setupRealtime();
    })();

    return () => {
      mounted = false;
      teardownRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const azioniAttive = useMemo(() => azioni.filter((a) => (a.is_active ?? true) === true), [azioni]);

  async function assegnaAzione() {
    if (!isAdmin) return;
    if (!selectedPartecipanteId || !selectedAzioneId) return;

    setBusy(true);
    setErr(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // insert minimo, punti derivati dalla tabella azioni
      const payload = {
        partecipante_id: selectedPartecipanteId,
        azione_id: selectedAzioneId,
        created_by: user.id,
      };

      const { error } = await supabase.from("log_azioni").insert(payload as any);
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’assegnazione.");
    } finally {
      setBusy(false);
    }
  }

  async function annullaUltimaAzione() {
    if (!isAdmin) return;

    setBusy(true);
    setErr(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // ✅ annulla l’ultima azione INSERITA DA TE (admin)
      const { data, error } = await supabase
        .from("log_azioni")
        .select("id, created_by, created_at")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      const last = (data || [])?.[0] as any;
      if (!last?.id) {
        setErr("Nessuna azione da annullare (per questo admin).");
        return;
      }

      const { error: delErr } = await supabase.from("log_azioni").delete().eq("id", last.id);
      if (delErr) throw delErr;
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’annullamento.");
    } finally {
      setBusy(false);
    }
  }

  const feed = useMemo(() => {
    return logAzioni.map((l, idx) => {
      const p = l.partecipante_id ? mapPartecipante.get(l.partecipante_id) : undefined;
      const a = l.azione_id ? mapAzione.get(l.azione_id) : undefined;

      const squadraId = l.partecipante_id ? mapPartecipanteToSquadra.get(l.partecipante_id) : undefined;
      const s = squadraId ? mapSquadra.get(squadraId) : undefined;

      const capo = s?.owner_user_id ? mapProfile.get(s.owner_user_id) : undefined;

      const punti = typeof a?.punti === "number" ? a!.punti! : 0;
      const safeKey = `${l.id ?? l.created_at ?? "row"}-${idx}`;

      return {
        safeKey,
        when: l.created_at,
        partecipanteNome: (p?.nome || "—").trim() || "—",
        partecipanteFoto: p?.foto_url ?? null,
        azioneNome: (a?.nome || "—").trim() || "—",
        azioneDescr: (a?.descrizione || "").trim(),
        punti,
        squadraNome: (s?.nome_squadra || "—").trim() || "—",
        capoNome: (capo?.nome || "—").trim() || "—",
      };
    });
  }, [logAzioni, mapPartecipante, mapAzione, mapPartecipanteToSquadra, mapSquadra, mapProfile]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>👑 Punteggi</Badge>
                <Badge>Admin</Badge>
                <Badge>Realtime</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Punteggi (Admin)</h1>
              <p className="text-white/70 leading-relaxed">
                Seleziona un membro (partecipante_evento) + un’azione. I punti vengono calcolati automaticamente da{" "}
                <b>azioni.punti</b>.
              </p>
            </div>

            {/* TOP RIGHT BUTTONS */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                ← Home
              </Link>

              <Link
                href="/classifica"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Vai a Classifica →
              </Link>

              <button
                onClick={loadAll}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                disabled={loading || busy}
              >
                ↻ Aggiorna
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-6xl px-6 pb-14 space-y-6">
        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ✖ {err}
            <div className="mt-1 text-red-200/70 text-sm">(Non rompe la UI: puoi continuare.)</div>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Caricamento…
          </div>
        ) : !isAdmin ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            🔒 Questa pagina è solo per l’Admin.
          </div>
        ) : (
          <>
            {/* ASSEGNA */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">⚡ Assegna azione</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Seleziona il membro e l’azione. Il punteggio si calcola da solo.
                  </p>
                </div>

                <button
                  onClick={annullaUltimaAzione}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 disabled:opacity-50"
                  disabled={busy}
                  title="Annulla l’ultima azione inserita da te (admin)"
                >
                  ↩ Annulla ultima azione
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Partecipante */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Membro (partecipante_evento)</div>
                  <select
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none"
                    value={selectedPartecipanteId}
                    onChange={(e) => setSelectedPartecipanteId(e.target.value)}
                    disabled={busy}
                  >
                    {partecipanti.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome ?? p.id}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3 flex items-center gap-3">
                    <Avatar
                      url={selectedPartecipante?.foto_url}
                      alt={selectedPartecipante?.nome ?? "Membro"}
                      size={42}
                      fallback={(selectedPartecipante?.nome?.[0] || "M").toUpperCase()}
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">{selectedPartecipante?.nome ?? "—"}</div>
                      <div className="text-sm text-white/60">
                        Costo: {selectedPartecipante?.costo ?? 0} Dbr
                      </div>
                    </div>
                  </div>
                </div>

                {/* Azione */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Azione</div>
                  <select
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none"
                    value={selectedAzioneId}
                    onChange={(e) => setSelectedAzioneId(e.target.value)}
                    disabled={busy}
                  >
                    {azioniAttive.map((a) => (
                      <option key={a.id} value={a.id}>
                        {(a.nome ?? a.codice ?? a.id) as string}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3">
                    <div className="font-extrabold">{selectedAzione?.nome ?? "—"}</div>
                    {selectedAzione?.descrizione ? (
                      <div className="mt-1 text-sm text-white/65 leading-relaxed">
                        {selectedAzione.descrizione}
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-white/40">(Nessuna descrizione)</div>
                    )}
                  </div>
                </div>

                {/* Punti + Assegna */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Punti (auto)</div>

                  <div className="mt-2">
                    {puntiDerivati >= 0 ? (
                      <Chip tone="green">+{puntiDerivati} pt</Chip>
                    ) : (
                      <Chip tone="red">{puntiDerivati} pt</Chip>
                    )}
                  </div>

                  <button
                    onClick={assegnaAzione}
                    disabled={busy || !selectedPartecipanteId || !selectedAzioneId}
                    className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
                  >
                    {busy ? "..." : "Assegna"}
                  </button>

                  <div className="mt-3 text-xs text-white/45">
                    Nota: l’azione viene legata al membro. La squadra si deduce automaticamente da{" "}
                    <b>squadra_membri</b>.
                  </div>
                </div>
              </div>
            </section>

            {/* FEED */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">🧾 Storico azioni</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Ultime 200. Mostriamo membro, azione, punti e squadra (senza join FK).
                  </p>
                </div>
                <Chip tone="neutral">{feed.length} righe</Chip>
              </div>

              {feed.length === 0 ? (
                <div className="mt-5 text-white/70">Nessuna azione assegnata (ancora).</div>
              ) : (
                <div className="mt-5 space-y-3">
                  {feed.map((r) => {
                    const bonus = r.punti >= 0;
                    return (
                      <div
                        key={r.safeKey}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-extrabold break-words">{r.azioneNome}</div>
                            {r.azioneDescr ? (
                              <div className="mt-1 text-sm text-white/65">{r.azioneDescr}</div>
                            ) : null}

                            <div className="mt-3 flex items-center gap-3">
                              <Avatar
                                url={r.partecipanteFoto}
                                alt={r.partecipanteNome}
                                size={38}
                                fallback={(r.partecipanteNome?.[0] || "P").toUpperCase()}
                              />
                              <div className="text-sm text-white/75">
                                👤 <b>{r.partecipanteNome}</b>{" "}
                                <span className="text-white/45">• {fmtTime(r.when)}</span>
                                <div className="mt-1 text-xs text-white/55">
                                  Squadra: <b>{r.squadraNome}</b> • Capo: <b>{r.capoNome}</b>
                                </div>
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
            </section>

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
