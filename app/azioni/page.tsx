"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";


type AzioneRow = {
  id: string;
  nome: string | null;
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

  // TAB: "list" o "admin"
  const [tab, setTab] = useState<"list" | "admin">("list");

  // Admin form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [punti, setPunti] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const sortedAzioni = useMemo(() => {
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
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const user = authData.user;
      if (!user) {
        setIsAdmin(false);
      } else {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();

        setIsAdmin(!profErr && !!prof?.is_admin);
      }

      const { data, error } = await supabase
        .from("azioni")
        .select("id,nome,punti,codice,is_active,created_at")
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
    setPunti(0);
    setIsActive(true);
  }

  function startEdit(a: AzioneRow) {
    setEditingId(a.id);
    setNome(a.nome ?? "");
    setPunti(a.punti ?? 0);
    setIsActive(a.is_active ?? true);
    setTab("admin");
  }

  async function saveAction() {
    setErrorMsg(null);

    const cleanNome = nome.trim();
    if (!cleanNome) {
      setErrorMsg("Inserisci il titolo dell’azione.");
      return;
    }

    const payload = {
      nome: cleanNome,
      punti: Number.isFinite(punti) ? punti : 0,
      is_active: isActive,
      codice: slugify(cleanNome),
      descrizione: null, // così NON la usiamo più
    } as any;

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
      setTab("list");
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
        <header className="mb-4 flex items-center justify-between gap-3">
  <div>
    <h1 className="text-3xl font-extrabold tracking-tight">🔥 Azioni</h1>
    <p className="mt-2 text-sm text-white/70">
      Leggi bene ogni azione prima di giocare 👇
    </p>
  </div>

  <a
    href="/"
    className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
  >
    🏠 Home
  </a>
</header>


        {/* TAB SWITCH */}
        <div className="mb-5 flex items-center gap-2">
          <button
            onClick={() => setTab("list")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              tab === "list"
                ? "border-white/25 bg-white text-black"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            Lista
          </button>

          <button
            onClick={() => setTab("admin")}
            disabled={!isAdmin}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              !isAdmin
                ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                : tab === "admin"
                ? "border-white/25 bg-white text-black"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
            title={!isAdmin ? "Solo admin" : ""}
          >
            Admin
          </button>
        </div>

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
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="mt-3 h-3 w-1/3 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* TAB: LISTA */}
        {!loading && tab === "list" && !errorMsg && (
          <section className="space-y-3 pb-10">
            {sortedAzioni.map((a) => {
              const title = a.nome ?? "Azione";
              const pts = a.punti ?? 0;
              const active = a.is_active ?? true;

              return (
                <article
                  key={a.id}
                  className={`rounded-2xl border p-4 ${
                    active ? "border-white/10 bg-white/5" : "border-white/10 bg-white/3 opacity-60"
                  }`}
                >
                  <div className="flex justify-end">
  <Link
    href="/"
    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
  >
    ← Home
  </Link>
</div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* SOLO TITOLO: niente descrizione */}
                      <div className="text-base font-extrabold leading-snug break-words">
                        {title}
                      </div>

                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/80">
                        <span className="font-semibold">Punti:</span>
                        <span className="font-extrabold text-white">{pts}</span>
                        {!active && <span className="ml-1">· disattiva</span>}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => startEdit(a)}
                        className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      >
                        Modifica
                      </button>
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

        {/* TAB: ADMIN */}
        {!loading && tab === "admin" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            {!isAdmin ? (
              <div className="text-sm text-white/70">Area riservata admin.</div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Gestione Azioni</div>
                    <div className="text-xs text-white/70">Aggiungi, modifica o elimina</div>
                  </div>

                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                    >
                      Annulla
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-white/70">Titolo</label>
                    <input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Es. Perde la voce"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
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

                  {/* LISTA PER ELIMINARE AL VOLO */}
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-xs text-white/70 mb-2">Azioni esistenti</div>
                    <div className="space-y-2">
                      {sortedAzioni.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                        >
                          <div className="min-w-0 text-sm font-semibold break-words">
                            {a.nome ?? "Azione"}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => startEdit(a)}
                              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                            >
                              Modifica
                            </button>
                            <button
                              onClick={() => deleteAction(a.id)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs hover:bg-red-500/15"
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                      ))}
                      {sortedAzioni.length === 0 && (
                        <div className="text-sm text-white/60">Nessuna azione.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
