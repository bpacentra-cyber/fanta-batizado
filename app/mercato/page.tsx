"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


type Partecipante = {
  id: string; // uuid
  nome: string;
  costo: number; // int4
  foto_url: string | null;
};

type Squadra = {
  id: string; // uuid
  owner_user_id: string; // uuid
  nome_squadra: string;
  budget_totale: number;
  budget_speso: number;
  punteggio: number;
};

type Profilo = {
  user_id: string;
  nome: string;
  is_admin: boolean;
  foto_url: string | null;
};

type MembroConDettagli = {
  partecipante_id: string;
  nome: string;
  costo: number;
  foto_url: string | null;
};

const MAX_MEMBRI = 6;
const BUDGET_INIZIALE = 500;

export default function MercatoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [userId, setUserId] = useState<string | null>(null);
  const [profilo, setProfilo] = useState<Profilo | null>(null);
  const [squadra, setSquadra] = useState<Squadra | null>(null);

  const [partecipanti, setPartecipanti] = useState<Partecipante[]>([]);
  const [confermati, setConfermati] = useState<MembroConDettagli[]>([]);

  // bozza = selezioni locali prima della conferma
  const [bozzaIds, setBozzaIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // nome squadra manuale
  const [nomeSquadraInput, setNomeSquadraInput] = useState("");
  const [savingNome, setSavingNome] = useState(false);
  const [msgNome, setMsgNome] = useState<string>("");

  // --- Helpers calcoli ---
  const confermatiSpesa = useMemo(
    () => confermati.reduce((sum, p) => sum + (p.costo ?? 0), 0),
    [confermati]
  );

  const bozzaSpesa = useMemo(() => {
    if (!partecipanti.length || bozzaIds.size === 0) return 0;
    const map = new Map(partecipanti.map((p) => [p.id, p.costo]));
    let sum = 0;
    for (const id of bozzaIds) sum += map.get(id) ?? 0;
    return sum;
  }, [bozzaIds, partecipanti]);

  const spesaTotale = confermatiSpesa + bozzaSpesa;
  const rimanente = useMemo(() => BUDGET_INIZIALE - spesaTotale, [spesaTotale]);

  const confermatiCount = confermati.length;
  const bozzaCount = bozzaIds.size;

  const confermabili = useMemo(() => {
    if (!squadra) return false;
    if (saving) return false;
    if (bozzaCount === 0) return false;
    if (confermatiCount + bozzaCount > MAX_MEMBRI) return false;
    if (rimanente < 0) return false;
    return true;
  }, [squadra, saving, bozzaCount, confermatiCount, rimanente]);

  function isConfermato(id: string) {
    return confermati.some((c) => c.partecipante_id === id);
  }

  function toggleBozza(id: string) {
    setBozzaIds((prev) => {
      const next = new Set(prev);
      if (isConfermato(id)) return next;
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function ensureNomeSquadraDaProfilo(
    user_id: string,
    squadraCorrente: Squadra,
    prof?: Profilo | null
  ) {
    const nomeAttuale = (squadraCorrente.nome_squadra ?? "").trim();
    const nomeDefault =
      nomeAttuale.length === 0 || nomeAttuale.toLowerCase() === "la mia squadra";

    if (!nomeDefault) return;

    const nomeNuovo = prof?.nome ? String(prof.nome).trim() : "";
    if (!nomeNuovo) return;

    const { error: updErr } = await supabase
      .from("squadre")
      .update({ nome_squadra: nomeNuovo })
      .eq("id", squadraCorrente.id);

    if (!updErr) {
      setSquadra((prev) => (prev ? { ...prev, nome_squadra: nomeNuovo } : prev));
    }
  }

  // --- Caricamento iniziale ---
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr("");

      // 1) session
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionErr) {
        setErr(`Errore sessione: ${sessionErr.message}`);
        setLoading(false);
        return;
      }

      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      // 2) profilo
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, nome, is_admin, foto_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const profOk = !profErr && prof ? (prof as Profilo) : null;
      if (profOk) setProfilo(profOk);

      // 3) carica o crea squadra
      const { data: squadraRow, error: squadraErr } = await supabase
        .from("squadre")
        .select("*")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (squadraErr) {
        setErr(`Errore squadra: ${squadraErr.message}`);
        setLoading(false);
        return;
      }

      let squadraFinal = squadraRow as Squadra | null;

      // se non esiste: crea con nome = profilo.nome (automatico)
      if (!squadraFinal) {
        const nomeDaProfilo =
          profOk?.nome && String(profOk.nome).trim().length > 0
            ? String(profOk.nome).trim()
            : "La mia squadra";

        const { data: created, error: createErr } = await supabase
          .from("squadre")
          .insert({
            owner_user_id: user.id,
            nome_squadra: nomeDaProfilo,
            budget_totale: BUDGET_INIZIALE,
            budget_speso: 0,
            punteggio: 0,
          })
          .select("*")
          .single();

        if (!mounted) return;

        if (createErr) {
          setErr(`Errore creazione squadra: ${createErr.message}`);
          setLoading(false);
          return;
        }

        squadraFinal = created as Squadra;
      } else {
        // se esiste ma è default, prova ad allineare al profilo
        await ensureNomeSquadraDaProfilo(user.id, squadraFinal, profOk);
      }

      setSquadra(squadraFinal);
      setNomeSquadraInput(squadraFinal.nome_squadra ?? "");

      // 4) partecipanti
      const { data: parts, error: partsErr } = await supabase
        .from("partecipanti_evento")
        .select("id, nome, costo, foto_url")
        .order("costo", { ascending: false });

      if (!mounted) return;

      if (partsErr) {
        setErr(`Errore partecipanti: ${partsErr.message}`);
        setLoading(false);
        return;
      }

      setPartecipanti((parts ?? []) as Partecipante[]);

      // 5) membri confermati
      const { data: sm, error: smErr } = await supabase
        .from("squadra_membri")
        .select("partecipante_id")
        .eq("squadra_id", squadraFinal.id);

      if (!mounted) return;

      if (smErr) {
        setErr(`Errore membri squadra: ${smErr.message}`);
        setLoading(false);
        return;
      }

      const ids = (sm ?? []).map((r: any) => r.partecipante_id).filter(Boolean);

      if (ids.length === 0) {
        setConfermati([]);
        setBozzaIds(new Set());
        setLoading(false);
        return;
      }

      const { data: dett, error: dettErr } = await supabase
        .from("partecipanti_evento")
        .select("id, nome, costo, foto_url")
        .in("id", ids);

      if (!mounted) return;

      if (dettErr) {
        setErr(`Errore dettagli membri: ${dettErr.message}`);
        setLoading(false);
        return;
      }

      const confermatiDett: MembroConDettagli[] = (dett ?? []).map((p: any) => ({
        partecipante_id: p.id,
        nome: p.nome,
        costo: p.costo,
        foto_url: p.foto_url ?? null,
      }));

      confermatiDett.sort(
        (a, b) => ids.indexOf(a.partecipante_id) - ids.indexOf(b.partecipante_id)
      );

      setConfermati(confermatiDett);
      setBozzaIds(new Set());
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function salvaNomeSquadra() {
    if (!squadra) return;

    const nome = nomeSquadraInput.trim();
    setMsgNome("");
    setSavingNome(true);
    setErr("");

    try {
      if (nome.length < 2) {
        setMsgNome("❌ Nome troppo corto (min 2 caratteri).");
        return;
      }

      const { error } = await supabase
        .from("squadre")
        .update({ nome_squadra: nome })
        .eq("id", squadra.id);

      if (error) {
        setMsgNome(`❌ ${error.message}`);
        return;
      }

      setSquadra((prev) => (prev ? { ...prev, nome_squadra: nome } : prev));
      setMsgNome("✅ Nome squadra salvato.");
    } finally {
      setSavingNome(false);
      setTimeout(() => setMsgNome(""), 2500);
    }
  }

  // --- Conferma bozza ---
  async function confermaSquadra() {
    if (!squadra || !userId) return;
    if (!confermabili) return;

    setSaving(true);
    setErr("");

    try {
      const idsDaInserire = Array.from(bozzaIds).filter(
        (pid) => !isConfermato(pid)
      );

      if (idsDaInserire.length === 0) return;

      const payload = idsDaInserire.map((pid) => ({
        squadra_id: squadra.id,
        partecipante_id: pid,
      }));

      const { error: insErr } = await supabase
        .from("squadra_membri")
        .insert(payload);

      if (insErr) {
        setErr(`Errore conferma: ${insErr.message}`);
        return;
      }

      const nuovoBudgetSpeso = confermatiSpesa + bozzaSpesa;

      const { error: updErr } = await supabase
        .from("squadre")
        .update({ budget_speso: nuovoBudgetSpeso })
        .eq("id", squadra.id);

      if (updErr) {
        setErr(`Conferma ok, ma budget non aggiornato: ${updErr.message}`);
      }

      // refresh membri
      const { data: sm, error: smErr } = await supabase
        .from("squadra_membri")
        .select("partecipante_id")
        .eq("squadra_id", squadra.id);

      if (smErr) {
        setErr(`Errore refresh membri: ${smErr.message}`);
        return;
      }

      const ids = (sm ?? []).map((r: any) => r.partecipante_id).filter(Boolean);

      const { data: dett, error: dettErr } = await supabase
        .from("partecipanti_evento")
        .select("id, nome, costo, foto_url")
        .in("id", ids);

      if (dettErr) {
        setErr(`Errore refresh dettagli: ${dettErr.message}`);
        return;
      }

      const confermatiDett: MembroConDettagli[] = (dett ?? []).map((p: any) => ({
        partecipante_id: p.id,
        nome: p.nome,
        costo: p.costo,
        foto_url: p.foto_url ?? null,
      }));

      confermatiDett.sort(
        (a, b) => ids.indexOf(a.partecipante_id) - ids.indexOf(b.partecipante_id)
      );

      setConfermati(confermatiDett);
      setBozzaIds(new Set());

      setSquadra((prev) =>
        prev ? { ...prev, budget_speso: nuovoBudgetSpeso } : prev
      );
    } finally {
      setSaving(false);
    }
  }

  // --- UI ---
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6">
        <div className="mx-auto max-w-5xl text-white/70">Caricamento Mercato...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Mercato</h1>
            <p className="text-white/70 mt-1">
              Seleziona in bozza → Conferma. Max {MAX_MEMBRI} membri.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/squadre"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Squadre
            </Link>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            ❌ {err}
          </div>
        )}

        {/* Summary */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 backdrop-blur">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="text-white/60 text-sm">La mia squadra</div>
              <div className="text-2xl font-extrabold mt-1">
                {squadra?.nome_squadra ?? "—"}
              </div>

              <div className="text-white/70 mt-2">
                Caposquadra: <b>{profilo?.nome ? profilo.nome : "—"}</b>
              </div>

              {/* Nome squadra manuale */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-white/70 text-sm">
                  Nome squadra (opzionale)
                </div>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    value={nomeSquadraInput}
                    onChange={(e) => setNomeSquadraInput(e.target.value)}
                    placeholder="Es. I Mangia-Roda"
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none focus:bg-white/10"
                  />
                  <button
                    onClick={salvaNomeSquadra}
                    disabled={!squadra || savingNome}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      savingNome
                        ? "bg-white/20 text-white/60 cursor-not-allowed"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    {savingNome ? "Salvo..." : "Salva"}
                  </button>
                </div>
                {msgNome && (
                  <div className="mt-2 text-sm text-white/80">{msgNome}</div>
                )}
                <div className="mt-2 text-xs text-white/55">
                  Default: uguale al nome caposquadra. Se lo cambi qui, vale il nome
                  manuale.
                </div>
              </div>

              <div className="text-white/70 mt-4">
                Confermati: <b>{confermatiCount}</b> — Bozza:{" "}
                <b>
                  {bozzaCount}/{MAX_MEMBRI}
                </b>
              </div>

              {confermatiCount > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {confermati.map((m) => (
                    <span
                      key={m.partecipante_id}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-sm"
                      title={`${m.nome} — ${m.costo} Dbr`}
                    >
                      <span className="h-6 w-6 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                        {m.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.foto_url}
                            alt={m.nome}
                            className="h-6 w-6 object-cover"
                          />
                        ) : (
                          "👤"
                        )}
                      </span>
                      <span className="font-semibold">{m.nome}</span>
                      <span className="text-white/60">{m.costo} Dbr</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-[340px] rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between">
                <div className="text-white/70 text-sm">Bozza spesa</div>
                <div className="text-xl font-extrabold">{bozzaSpesa} Dbr</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-white/70 text-sm">Bozza rimanente</div>
                <div
                  className={`text-2xl font-extrabold ${
                    rimanente < 0 ? "text-red-300" : "text-emerald-300"
                  }`}
                >
                  {rimanente} Dbr
                </div>
              </div>

              <button
                onClick={confermaSquadra}
                disabled={!confermabili}
                className={`mt-4 w-full rounded-2xl px-5 py-3 text-sm font-semibold transition
                  ${
                    confermabili
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/20 text-white/50 cursor-not-allowed"
                  }`}
              >
                {saving ? "Confermo..." : "Conferma squadra"}
              </button>

              <p className="mt-3 text-xs text-white/55">
                Budget iniziale: {BUDGET_INIZIALE} Dbr — Confermati spesa:{" "}
                {confermatiSpesa} Dbr
              </p>
            </div>
          </div>
        </section>

        {/* Lista partecipanti */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Partecipanti</h2>
            <div className="text-sm text-white/60">
              Selezionati in bozza: {bozzaCount}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partecipanti.map((p) => {
              const confermato = isConfermato(p.id);
              const inBozza = bozzaIds.has(p.id);

              const full =
                confermatiCount + bozzaCount >= MAX_MEMBRI && !inBozza;

              return (
                <button
                  key={p.id}
                  onClick={() => toggleBozza(p.id)}
                  disabled={confermato || full}
                  className={`text-left rounded-[22px] border p-4 transition backdrop-blur
                    ${
                      confermato
                        ? "border-white/10 bg-white/[0.06] opacity-70 cursor-not-allowed"
                        : inBozza
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-white/10 bg-white/[0.06] hover:bg-white/[0.10]"
                    }
                    ${full ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={
                    confermato
                      ? "Già in squadra"
                      : full
                      ? "Hai raggiunto il massimo membri"
                      : "Seleziona/Deseleziona"
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center">
                      {p.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.foto_url}
                          alt={p.nome}
                          className="h-12 w-12 object-cover"
                        />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-extrabold truncate">{p.nome}</div>
                        <div className="text-white/70 font-semibold whitespace-nowrap">
                          {p.costo} Dbr
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-white/60">
                        {confermato
                          ? "✅ Confermato"
                          : inBozza
                          ? "📝 In bozza (clicca per togliere)"
                          : "➕ Clicca per aggiungere"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-white/45 mt-2">
            Nota: puoi cambiare la bozza liberamente finché non premi “Conferma
            squadra”.
          </p>
        </section>
      </div>
    </main>
  );
}
