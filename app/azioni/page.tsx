"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AzioneRow = {
  id: string;
  nome: string | null;
  descrizione: string | null;
  punti: number | null;
  codice: string | null;
  is_active: boolean | null;
  created_at?: string | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function AzioniPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [azioni, setAzioni] = useState<AzioneRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [punti, setPunti] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const sortedAzioni = useMemo(() => {
    // solo attive in cima (e poi per nome)
    const copy = [...azioni];
    copy.sort((a, b) => {
      const aa = a.is_active ?? true;
      const bb = b.is_active ?? true;
      if (aa !== bb) return aa ? -1 : 1;
      const an = (a.nome ?? "").toLowerCase();
      const bn = (b.nome ?? "").toLowerCase();
      return an.localeCompare(bn);
    });
    return copy;
  }, [azioni]);

  async function loadAll() {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1) sessione
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const user = authData.user;
      if (!user) {
        // se non loggato, rimandalo a login (se vuoi)
        // window.location.href = "/login";
        setIsAdmin(false);
      } else {
        // 2) check admin dal profilo
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();

        if (profErr) {
          // se il profilo non esiste o errore, NON admin
          setIsAdmin(false);
        } else {
          setIsAdmin(!!prof?.is_admin);
        }
      }

      // 3) carica azioni
      const { data, error } = await supabase
        .from("azioni")
        .select("id,nome,descrizione,punti,codice,is_active,created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAzioni((data ?? []) as AzioneRow[]);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? "Errore nel caricamento delle azioni.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setNome("");
    setDescrizione("");
    setPunti(0);
    setIsActive(true);
  }

  function startEdit(a: AzioneRow) {
    setEditingId(a.id);
    setNome(a.nome ?? "");
    setDescrizione(a.descrizione ?? "");
    setPunti(a.punti ?? 0);
    setIsActive(a.is_active ?? true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAction() {
    setErrorMsg(null);

    const cleanNome = nome.trim();
    const cleanDesc = descrizione.trim();

    if (!cleanNome) {
      setErrorMsg("Inserisci un titolo (nome) per l’azione.");
      return;
    }

    const payload = {
      nome: cleanNome,
      descrizione: cleanDesc ? cleanDesc : null,
      punti: Number.isFinite(punti) ? punti : 0,
      is_active: isActive,
      // codice lo generiamo noi (non lo mostriamo agli utenti)
      codice: slugify(cleanNome),
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("azioni").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("azioni").insert(payload);
        if (error) throw error;
      }

      resetForm();
      await loadAll();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? "Errore nel salvataggio.");
    }
  }

  async function deleteAction(id: string) {
    const ok = confirm("Vuoi eliminare questa azione? (non si torna indietro)");
    if (!ok) return;

    setErrorMsg(null);
    try {
      const { error } = await supabase.from("azioni").delete().eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? "Errore eliminazione.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight">🔥 Azioni</h1>
          <p className="mt-2 text-sm text-white/70">
            Leggi bene ogni azione prima di giocare 👇
          </p>
        </header>

        {/* ADMIN PANEL */}
        {isAdmin && (
          <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Pannello Admin</div>
                <div className="text-xs text-white/70">
                  Aggiungi / modifica / elimina azioni (solo tu)
                </div>
              </div>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                >
                  Annulla modifica
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-white/70">Titolo (nome)</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Es. Perde la voce"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="text-xs text-white/70">Descrizione (opzionale)</label>
                <textarea
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Dettagli extra dell’azione (se serve)"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70">Punti</label>
                  <input
                    type="number"
                    value={punti}
                    onChange={(e) => setPunti(parseInt(e.target.value || "0", 10))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                  />
                </div>

                <div className="flex items-end justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                  <div>
                    <div className="text-xs text-white/70">Attiva</div>
                    <div className="text-sm font-semibold">{isActive ? "Sì" : "No"}</div>
                  </div>
                  <button
                    onClick={() => setIsActive((v) => !v)}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                  >
                    Toggle
                  </button>
                </div>
              </div>

              <button
                onClick={saveAction}
                className="w-full rounded-xl bg-white text-black px-4 py-3 text-sm font-bold hover:opacity-90"
              >
                {editingId ? "Salva modifiche" : "Aggiungi azione"}
              </button>
            </div>
          </section>
        )}

        {/* ERROR */}
        {!loading && errorMsg && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            <div className="font-semibold">Errore</div>
            <div className="mt-1 text-white/80 break-words">{errorMsg}</div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
              >
                <div className="h-4 w-1/2 rounded bg-white/10" />
                <div className="mt-3 h-3 w-full rounded bg-white/10" />
                <div className="mt-2 h-3 w-4/5 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* LISTA AZIONI (mobile-friendly, testo non tagliato) */}
        {!loading && !errorMsg && (
          <section className="space-y-3 pb-10">
            {sortedAzioni.map((a) => {
              const title = a.nome ?? "Azione";
              const desc = a.descrizione ?? "";
              const pts = a.punti ?? 0;
              const active = a.is_active ?? true;

              return (
                <article
                  key={a.id}
                  className={`rounded-2xl border p-4 ${
                    active
                      ? "border-white/10 bg-white/5"
                      : "border-white/10 bg-white/3 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-extrabold leading-snug break-words">
                        {title}
                      </div>

                      {/* Qui NON tagliamo mai: break-words + whitespace-pre-wrap */}
                      {desc && (
                        <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap break-words">
                          {desc}
                        </div>
                      )}

                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/80">
                        <span className="font-semibold">Punti:</span>
                        <span className="font-extrabold text-white">{pts}</span>
                        {!active && <span className="ml-1">· disattiva</span>}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => startEdit(a)}
                          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => deleteAction(a.id)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs hover:bg-red-500/15"
                        >
                          Elimina
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {sortedAzioni.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Nessuna azione trovata.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
