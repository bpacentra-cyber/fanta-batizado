"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Azione = {
  id: string;
  nome: string;
  descrizione: string | null;
  punti: number;
  is_active: boolean;
};

export default function AzioniPage() {
  const [azioni, setAzioni] = useState<Azione[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [nuovaAzione, setNuovaAzione] = useState("");
  const [punti, setPunti] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editPunti, setEditPunti] = useState(1);

  async function loadAzioni() {
    setLoading(true);

    const { data } = await supabase
      .from("azioni")
      .select("*")
      .eq("is_active", true)
      .order("nome");

    setAzioni((data || []) as Azione[]);
    setLoading(false);
  }

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Se nella tua tabella profiles la PK è user_id invece di id:
    // cambia .eq("id", user.id) -> .eq("user_id", user.id)
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (data?.is_admin) setIsAdmin(true);
  }

  useEffect(() => {
    loadAzioni();
    checkAdmin();
  }, []);

  async function creaAzione() {
    if (!nuovaAzione.trim()) return;

    await supabase.from("azioni").insert({
      nome: nuovaAzione,
      punti,
      is_active: true,
    });

    setNuovaAzione("");
    setPunti(1);
    loadAzioni();
  }

  async function elimina(id: string) {
    if (!confirm("Eliminare questa azione?")) return;

    await supabase.from("azioni").delete().eq("id", id);
    loadAzioni();
  }

  async function salvaModifica(id: string) {
    await supabase
      .from("azioni")
      .update({
        nome: editNome,
        punti: editPunti,
      })
      .eq("id", id);

    setEditingId(null);
    loadAzioni();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 max-w-xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">⚡ Azioni</h1>

        <Link
          href="/"
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          ← Home
        </Link>
      </div>

      {/* CREA AZIONE (solo admin) */}
      {isAdmin && (
        <div className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
          <div className="font-bold">➕ Nuova azione</div>

          <input
            value={nuovaAzione}
            onChange={(e) => setNuovaAzione(e.target.value)}
            placeholder="Titolo azione"
            className="w-full p-2 rounded bg-black border border-white/10"
          />

          <input
            type="number"
            value={punti}
            onChange={(e) => setPunti(Number(e.target.value))}
            className="w-full p-2 rounded bg-black border border-white/10"
          />

          <button
            onClick={creaAzione}
            className="w-full bg-green-600 py-2 rounded font-bold"
          >
            Salva
          </button>
        </div>
      )}

      {/* LISTA AZIONI */}
      {loading ? (
        <div>Caricamento...</div>
      ) : (
        <div className="space-y-3">
          {azioni.map((a) => {
            const isBonus = (a.punti ?? 0) >= 0;

            return (
              <div
                key={a.id}
                className="p-4 rounded-2xl border border-white/10 bg-white/5"
              >
                {editingId === a.id ? (
                  <>
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="w-full p-2 rounded bg-black border border-white/10 mb-2"
                    />

                    <input
                      type="number"
                      value={editPunti}
                      onChange={(e) => setEditPunti(Number(e.target.value))}
                      className="w-full p-2 rounded bg-black border border-white/10 mb-2"
                    />

                    <button
                      onClick={() => salvaModifica(a.id)}
                      className="w-full bg-green-600 py-2 rounded"
                    >
                      Salva
                    </button>
                  </>
                ) : (
                  <>
                    {/* SOLO TITOLO */}
                    <div className="font-bold text-lg break-words">{a.nome}</div>

                    {/* PUNTEGGIO sotto il titolo, colorato */}
                    <div
                      className={[
                        "mt-1 inline-flex items-center rounded-xl border px-3 py-1 text-sm font-extrabold",
                        isBonus
                          ? "border-green-500/25 bg-green-500/10 text-green-200"
                          : "border-red-500/25 bg-red-500/10 text-red-200",
                      ].join(" ")}
                    >
                      {isBonus ? `+${a.punti}` : `${a.punti}`} pt
                    </div>

                    {/* BOTTONI ADMIN */}
                    {isAdmin && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setEditingId(a.id);
                            setEditNome(a.nome);
                            setEditPunti(a.punti);
                          }}
                          className="flex-1 bg-yellow-600 py-1 rounded text-sm"
                        >
                          Modifica
                        </button>

                        <button
                          onClick={() => elimina(a.id)}
                          className="flex-1 bg-red-600 py-1 rounded text-sm"
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
    </main>
  );
}
