"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AzioneRow = {
  id: string;
  codice: string | null;
  nome: string | null;
  descrizione: string | null;
  punti: number | null;
  is_active: boolean | null;
  created_at?: string | null;
};

function makeCodice(input: string) {
  const base = (input || "")
    .trim()
    .toLowerCase()
    .replace(/à/g, "a")
    .replace(/è|é/g, "e")
    .replace(/ì/g, "i")
    .replace(/ò/g, "o")
    .replace(/ù/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

  // fallback ultra safe se input vuoto
  return base || `azione_${Date.now()}`;
}

export default function AzioniPage() {
  const [azioni, setAzioni] = useState<AzioneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [isAdmin, setIsAdmin] = useState(false);

  // ADD
  const [newTitolo, setNewTitolo] = useState("");
  const [newPunti, setNewPunti] = useState(0);

  // EDIT
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitolo, setEditTitolo] = useState("");
  const [editPunti, setEditPunti] = useState(0);

  const view = useMemo(() => {
    return azioni.map((a) => {
      const titolo =
        (a.descrizione && a.descrizione.trim()) ||
        (a.nome && a.nome.trim()) ||
        (a.codice && a.codice.trim()) ||
        "—";

      const punti = typeof a.punti === "number" ? a.punti : 0;
      const isBonus = punti >= 0;

      return { ...a, _titolo: titolo, _punti: punti, _isBonus: isBonus };
    });
  }, [azioni]);

  async function load() {
    setLoading(true);
    setErr("");

    try {
      // session + admin?
      const { data: userData, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;

      const user = userData.user;
      if (user) {
        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();

        if (pErr) {
          // se manca profilo, non rompiamo la pagina
          setIsAdmin(false);
        } else {
          setIsAdmin(profile?.is_admin === true);
        }
      } else {
        setIsAdmin(false);
      }

      // carico azioni
      // NB: leggiamo SIA nome CHE descrizione, così non “spariscono” quelle vecchie
      let q = supabase
        .from("azioni")
        .select("id, codice, nome, descrizione, punti, is_active, created_at")
        .order("created_at", { ascending: false });

      // se NON admin, mostra solo attive (se is_active è usato)
      if (!userData.user) {
        // se non loggato, prova comunque a leggere solo le attive (dipende dalle policy)
        q = q.eq("is_active", true);
      }

      const { data, error } = await q;
      if (error) throw error;

      const list = (data || []) as AzioneRow[];

      // se esiste is_active e ci sono valori null, non filtriamo via nulla
      setAzioni(list);
    } catch (e: any) {
      setAzioni([]);
      setErr(e?.message ?? "Errore caricamento azioni.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addAzione() {
    if (!newTitolo.trim()) return;

    setErr("");
    const codice = makeCodice(newTitolo);

    const { error } = await supabase.from("azioni").insert({
      codice, // ✅ evita problemi not-null
      descrizione: newTitolo.trim(),
      punti: Number(newPunti) || 0,
      is_active: true,
    });

    if (error) {
      setErr(error.message);
      return;
    }

    setNewTitolo("");
    setNewPunti(0);
    load();
  }

  async function deleteAzione(id: string) {
    if (!confirm("Eliminare questa azione?")) return;

    setErr("");
    const { error } = await supabase.from("azioni").delete().eq("id", id);

    if (error) {
      setErr(error.message);
      return;
    }
    load();
  }

  async function saveEdit(id: string) {
    setErr("");
    const codice = makeCodice(editTitolo);

    const { error } = await supabase
      .from("azioni")
      .update({
        codice, // ✅ sempre coerente
        descrizione: editTitolo.trim(),
        punti: Number(editPunti) || 0,
      })
      .eq("id", id);

    if (error) {
      setErr(error.message);
      return;
    }

    setEditId(null);
    load();
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">⚡ Azioni</h1>

        <Link
          href="/"
          className="rounded-xl border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
        >
          ← Home
        </Link>
      </div>

      {err ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          ❌ {err}
        </div>
      ) : null}

      {/* ADMIN - ADD */}
      {isAdmin && (
        <div className="mb-6 p-4 border border-white/10 rounded-xl bg-white/5">
          <div className="text-sm mb-2 font-semibold">➕ Nuova azione</div>

          <input
            value={newTitolo}
            onChange={(e) => setNewTitolo(e.target.value)}
            placeholder="Descrizione azione"
            className="w-full mb-2 p-2 rounded bg-black border border-white/20"
          />

          <input
            type="number"
            value={newPunti}
            onChange={(e) => setNewPunti(Number(e.target.value))}
            className="w-full mb-2 p-2 rounded bg-black border border-white/20"
          />

          <button
            onClick={addAzione}
            className="w-full bg-white text-black py-2 rounded font-bold hover:opacity-90"
          >
            Aggiungi
          </button>
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <div className="text-white/70">Caricamento...</div>
      ) : view.length === 0 ? (
        <div className="text-white/70">
          Nessuna azione trovata.
          <div className="mt-2 text-xs text-white/45">
            (Se le azioni esistono in tabella ma qui sono vuote, c’è una policy RLS che blocca la SELECT.)
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {view.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-xl border border-white/10 bg-white/5"
            >
              {editId === a.id ? (
                <>
                  <input
                    value={editTitolo}
                    onChange={(e) => setEditTitolo(e.target.value)}
                    className="w-full mb-2 p-2 bg-black border border-white/20 rounded"
                  />

                  <input
                    type="number"
                    value={editPunti}
                    onChange={(e) => setEditPunti(Number(e.target.value))}
                    className="w-full mb-2 p-2 bg-black border border-white/20 rounded"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(a.id)}
                      className="bg-green-500 px-3 py-2 rounded text-sm font-semibold"
                    >
                      Salva
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="border border-white/20 px-3 py-2 rounded text-sm"
                    >
                      Annulla
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* SOLO TITOLO (senza tagli) */}
                  <div className="font-bold break-words whitespace-normal">
                    {a._titolo}
                  </div>

                  {/* PUNTI */}
                  <div
                    className={`mt-2 text-sm font-bold ${
                      a._isBonus ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {a._isBonus ? `+${a._punti}` : a._punti}
                  </div>

                  {/* ADMIN BUTTONS */}
                  {isAdmin && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setEditId(a.id);
                          setEditTitolo(a._titolo);
                          setEditPunti(a._punti);
                        }}
                        className="px-3 py-2 text-xs border border-white/20 rounded"
                      >
                        Modifica
                      </button>

                      <button
                        onClick={() => deleteAzione(a.id)}
                        className="px-3 py-2 text-xs border border-red-500/40 rounded text-red-300"
                      >
                        Elimina
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
