"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AzioneRow = {
  id: string;
  codice: string | null;
  nome: string | null;
  descrizione: string | null;
  punti: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

function pointsChip(punti: number) {
  const bonus = punti >= 0;
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-2xl px-3 py-1 text-sm font-extrabold border",
        bonus
          ? "bg-green-500/10 text-green-200 border-green-500/20"
          : "bg-red-500/10 text-red-200 border-red-500/20",
      ].join(" ")}
      title={bonus ? "Bonus" : "Malus"}
    >
      {bonus ? `+${punti}` : `${punti}`}
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/à/g, "a")
    .replace(/è|é/g, "e")
    .replace(/ì/g, "i")
    .replace(/ò/g, "o")
    .replace(/ù/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
}

function genCodeFromNome(nome: string) {
  const base = slugify(nome || "azione") || "azione";
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${rnd}`;
}

export default function AzioniPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [rows, setRows] = useState<AzioneRow[]>([]);

  const [hasSession, setHasSession] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Form admin (add/edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [punti, setPunti] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);

  const channelsRef = useRef<any[]>([]);

  const visibleRows = useMemo(() => {
    // Tutti vedono solo attive; admin vede tutto
    const list = isAdmin ? rows : rows.filter((r) => r.is_active !== false);
    // ordina: attive sopra, poi per punti desc, poi nome
    return [...list].sort((a, b) => {
      const aActive = a.is_active !== false ? 1 : 0;
      const bActive = b.is_active !== false ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;

      const ap = a.punti ?? 0;
      const bp = b.punti ?? 0;
      if (ap !== bp) return bp - ap;

      const an = (a.nome ?? "").localeCompare(b.nome ?? "", "it");
      return an;
    });
  }, [rows, isAdmin]);

  function clearMessages() {
    setErr("");
    setOk("");
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
    const ch = supabase
      .channel("rt:azioni")
      .on("postgres_changes", { event: "*", schema: "public", table: "azioni" }, () => {
        // refresh semplice e robusto
        loadAzioni();
      })
      .subscribe();
    channelsRef.current.push(ch);
  }

  async function loadAuth() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    setHasSession(!!user);

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data: p } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    setIsAdmin(!!p?.is_admin);
  }

  async function loadAzioni() {
    clearMessages();
    setLoading(true);

    const { data, error } = await supabase
      .from("azioni")
      .select("id, codice, nome, descrizione, punti, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data || []) as AzioneRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      await loadAuth();
      if (!mounted) return;

      await loadAzioni();
      if (!mounted) return;

      setupRealtime();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      await loadAuth();
      await loadAzioni();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      teardownRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditingId(null);
    setNome("");
    setDescrizione("");
    setPunti("0");
    setIsActive(true);
  }

  function startEdit(r: AzioneRow) {
    clearMessages();
    setEditingId(r.id);
    setNome(r.nome ?? "");
    setDescrizione(r.descrizione ?? "");
    setPunti(String(r.punti ?? 0));
    setIsActive(r.is_active !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAction() {
    clearMessages();
    if (!isAdmin) return;

    const n = nome.trim();
    if (!n) {
      setErr("Inserisci un titolo (nome) per l’azione 👀");
      return;
    }

    // punti
    const p = Number(punti);
    if (Number.isNaN(p) || !Number.isFinite(p)) {
      setErr("Il campo punti deve essere un numero (es. 5 o -3).");
      return;
    }

    setBusy(true);
    try {
      if (!editingId) {
        // CREATE
        const codiceAuto = genCodeFromNome(n);

        const { error } = await supabase.from("azioni").insert({
          nome: n,
          descrizione: descrizione.trim() || null,
          punti: p,
          is_active: true,
          codice: codiceAuto, // non lo chiediamo: lo generiamo
        });

        if (error) throw error;

        setOk("✅ Azione creata.");
        resetForm();
      } else {
        // UPDATE
        // se per qualche motivo codice è null, lo rigeneriamo
        const current = rows.find((x) => x.id === editingId);
        const codiceSafe =
          (current?.codice && current.codice.trim()) || genCodeFromNome(n);

        const { error } = await supabase
          .from("azioni")
          .update({
            nome: n,
            descrizione: descrizione.trim() || null,
            punti: p,
            is_active: isActive,
            codice: codiceSafe,
          })
          .eq("id", editingId);

        if (error) throw error;

        setOk("✅ Modifiche salvate.");
        resetForm();
      }

      // refresh (anche se realtime lo farebbe)
      await loadAzioni();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante il salvataggio.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivateAction(id: string) {
    clearMessages();
    if (!isAdmin) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from("azioni")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setOk("🧊 Azione disattivata (non cancellata).");
      await loadAzioni();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante la disattivazione.");
    } finally {
      setBusy(false);
    }
  }

  async function reactivateAction(id: string) {
    clearMessages();
    if (!isAdmin) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from("azioni")
        .update({ is_active: true })
        .eq("id", id);

      if (error) throw error;

      setOk("🔥 Azione riattivata.");
      await loadAzioni();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante la riattivazione.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>⚡ Azioni</Badge>
                <Badge>Bonus / Malus</Badge>
                {isAdmin ? <Badge>👑 Admin</Badge> : null}
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Lista Azioni
              </h1>

              <p className="text-white/70 leading-relaxed max-w-2xl">
                Qui trovi tutte le azioni possibili durante il Batizado.
                <br />
                Il punteggio è già pronto: <b>verde = bonus</b>, <b>rosso = malus</b>.
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
              <button
                onClick={loadAzioni}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                disabled={busy}
                title="Ricarica"
              >
                ↻ Aggiorna
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 pb-14 space-y-6">
        {!hasSession ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/75">
            ⚠️ Per vedere (e soprattutto per giocare) devi fare login.
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
              >
                Vai al login →
              </Link>
            </div>
          </div>
        ) : null}

        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {ok ? (
          <div className="rounded-[28px] border border-green-500/30 bg-green-500/10 p-5 text-green-100">
            {ok}
          </div>
        ) : null}

        {/* ADMIN PANEL */}
        {isAdmin ? (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  🛠 Gestione Azioni (solo Admin)
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  Aggiungi / modifica / disattiva. Niente “codice”: lo crea l’app.
                </p>
              </div>

              {editingId ? (
                <button
                  onClick={resetForm}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  disabled={busy}
                >
                  Annulla modifica
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                <label className="text-xs text-white/60">Titolo (nome)</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  placeholder="Es. ‘Fa la ponte e cade’"
                  disabled={busy}
                />

                <label className="mt-4 block text-xs text-white/60">
                  Descrizione (solo per te / opzionale)
                </label>
                <textarea
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  className="mt-2 w-full min-h-[86px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  placeholder="Note interne (opzionale)."
                  disabled={busy}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs text-white/60">Punti</label>
                <input
                  value={punti}
                  onChange={(e) => setPunti(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  placeholder="Es. 5 oppure -3"
                  inputMode="numeric"
                  disabled={busy}
                />

                <div className="mt-4">
                  <label className="text-xs text-white/60">Stato</label>
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                    <span className="text-sm text-white/75">
                      {isActive ? "Attiva" : "Disattiva"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsActive((v) => !v)}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                      disabled={busy}
                    >
                      Toggle
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-white/60">Preview</div>
                  {pointsChip(Number.isFinite(Number(punti)) ? Number(punti) : 0)}
                </div>

                <button
                  onClick={saveAction}
                  disabled={busy || !nome.trim()}
                  className="mt-4 w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                >
                  {busy ? "..." : editingId ? "💾 Salva modifiche" : "➕ Crea azione"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* LIST */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">📋 Azioni disponibili</h2>
              <p className="mt-1 text-sm text-white/65">
                {isAdmin
                  ? "Tu vedi anche quelle disattivate (badge grigio)."
                  : "Solo azioni attive."}
              </p>
            </div>
            <div className="text-xs text-white/55">
              Totale visibili: <b className="text-white/80">{visibleRows.length}</b>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 text-white/70">Caricamento…</div>
          ) : visibleRows.length === 0 ? (
            <div className="mt-6 text-white/70">
              Nessuna azione trovata. (Admin: creane una sopra 👑)
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {visibleRows.map((r) => {
                const titolo = (r.nome ?? "").trim() || "Azione";
                const p = r.punti ?? 0;
                const active = r.is_active !== false;

                return (
                  <div
                    key={r.id}
                    className={[
                      "rounded-2xl border bg-black/30 p-4",
                      active ? "border-white/10" : "border-white/10 opacity-70",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {/* Titolo grande, multi-line, niente tagli */}
                        <div className="text-base sm:text-lg font-extrabold leading-snug break-words">
                          {titolo}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {pointsChip(p)}
                          {!active ? (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                              Disattivata
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {isAdmin ? (
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => startEdit(r)}
                            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                            disabled={busy}
                            title="Modifica"
                          >
                            ✏️
                          </button>

                          {active ? (
                            <button
                              onClick={() => deactivateAction(r.id)}
                              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100 hover:bg-red-500/15"
                              disabled={busy}
                              title="Disattiva"
                            >
                              🧊
                            </button>
                          ) : (
                            <button
                              onClick={() => reactivateAction(r.id)}
                              className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-100 hover:bg-green-500/15"
                              disabled={busy}
                              title="Riattiva"
                            >
                              🔥
                            </button>
                          )}
                        </div>
                      ) : null}
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
      </div>
    </main>
  );
}
