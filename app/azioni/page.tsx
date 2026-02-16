"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Azione = {
  id: string;
  titolo: string;
  punti: number;
};

export default function AzioniPage() {
  const [azioni, setAzioni] = useState<Azione[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  const [newTitolo, setNewTitolo] = useState("");
  const [newPunti, setNewPunti] = useState(0);

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitolo, setEditTitolo] = useState("");
  const [editPunti, setEditPunti] = useState(0);

  // =========================
  // LOAD
  // =========================
  async function load() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      setIsAdmin(profile?.is_admin === true);
    }

    const { data } = await supabase
      .from("azioni")
      .select("id, titolo:descrizione, punti")
      .order("created_at", { ascending: false });

    setAzioni(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // =========================
  // ADD
  // =========================
  async function addAzione() {
    if (!newTitolo) return;

    await supabase.from("azioni").insert({
      descrizione: newTitolo,
      punti: newPunti,
    });

    setNewTitolo("");
    setNewPunti(0);

    load();
  }

  // =========================
  // DELETE
  // =========================
  async function deleteAzione(id: string) {
    if (!confirm("Eliminare questa azione?")) return;

    await supabase.from("azioni").delete().eq("id", id);

    load();
  }

  // =========================
  // EDIT
  // =========================
  async function saveEdit(id: string) {
    await supabase
      .from("azioni")
      .update({
        descrizione: editTitolo,
        punti: editPunti,
      })
      .eq("id", id);

    setEditId(null);
    load();
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">⚡ Azioni</h1>

        <Link
          href="/"
          className="rounded-xl border border-white/20 px-3 py-1 text-sm"
        >
          ← Home
        </Link>
      </div>

      {/* ADMIN - ADD */}
      {isAdmin && (
        <div className="mb-6 p-4 border border-white/10 rounded-xl">
          <div className="text-sm mb-2">➕ Nuova azione</div>

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
            className="w-full bg-white text-black py-2 rounded font-bold"
          >
            Aggiungi
          </button>
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <div>Caricamento...</div>
      ) : (
        <div className="space-y-3">
          {azioni.map((a) => {
            const isBonus = a.punti >= 0;

            return (
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

                    <button
                      onClick={() => saveEdit(a.id)}
                      className="bg-green-500 px-3 py-1 rounded text-sm"
                    >
                      Salva
                    </button>
                  </>
                ) : (
                  <>
                    {/* TITOLO */}
                    <div className="font-bold break-words">
                      {a.titolo}
                    </div>

                    {/* PUNTI */}
                    <div
                      className={`mt-2 text-sm font-bold ${
                        isBonus ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isBonus ? `+${a.punti}` : a.punti}
                    </div>

                    {/* ADMIN BUTTONS */}
                    {isAdmin && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setEditId(a.id);
                            setEditTitolo(a.titolo);
                            setEditPunti(a.punti);
                          }}
                          className="px-2 py-1 text-xs border border-white/20 rounded"
                        >
                          Modifica
                        </button>

                        <button
                          onClick={() => deleteAzione(a.id)}
                          className="px-2 py-1 text-xs border border-red-500 rounded text-red-400"
                        >
                          Elimina
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
