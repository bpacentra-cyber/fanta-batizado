"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Squadra = { id: string; nome_squadra: string };
type Partecipante = { id: string; nome: string };
type Azione = { id: string; nome: string; punti: number };

export default function AdminLogPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [squadre, setSquadre] = useState<Squadra[]>([]);
  const [partecipanti, setPartecipanti] = useState<Partecipante[]>([]);
  const [azioni, setAzioni] = useState<Azione[]>([]);

  const [squadraId, setSquadraId] = useState("");
  const [partecipanteId, setPartecipanteId] = useState("");
  const [azioneId, setAzioneId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // check admin
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prof?.is_admin) {
        router.replace("/squadre");
        return;
      }

      const { data: sq, error: e1 } = await supabase
        .from("squadre")
        .select("id, nome_squadra")
        .order("nome_squadra", { ascending: true });

      if (e1) {
        setErr(e1.message);
        setLoading(false);
        return;
      }
      setSquadre((sq ?? []) as Squadra[]);

      const { data: pe, error: e2 } = await supabase
        .from("partecipanti_evento")
        .select("id, nome")
        .order("nome", { ascending: true });

      if (e2) {
        setErr(e2.message);
        setLoading(false);
        return;
      }
      setPartecipanti((pe ?? []) as Partecipante[]);

      const { data: az, error: e3 } = await supabase
        .from("azioni")
        .select("id, nome, punti")
        .order("punti", { ascending: false });

      if (e3) {
        setErr(e3.message);
        setLoading(false);
        return;
      }
      setAzioni((az ?? []) as Azione[]);

      setLoading(false);
    };

    load();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!squadraId || !partecipanteId || !azioneId) {
      setErr("Compila squadra, partecipante e azione.");
      return;
    }

    const { error } = await supabase.rpc("admin_log_action", {
      p_squadra_id: squadraId,
      p_partecipante_id: partecipanteId,
      p_azione_id: azioneId,
      p_note: note.trim() ? note.trim() : null,
    });

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("✅ Evento registrato e punteggio aggiornato.");
    setNote("");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        Caricamento…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin · Log Azioni</h1>
          <div className="flex gap-2">
            <a className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/5" href="/admin">
              Admin
            </a>
            <a className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/5" href="/classifica">
              Classifica
            </a>
          </div>
        </div>

        {err && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            ❌ {err}
          </div>
        )}

        {ok && (
          <div className="rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-green-200">
            {ok}
          </div>
        )}

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
          <div>
            <label className="text-sm text-white/70">Squadra</label>
            <select
              className="w-full mt-1 rounded-xl bg-neutral-900 border border-white/10 px-3 py-3"
              value={squadraId}
              onChange={(e) => setSquadraId(e.target.value)}
            >
              <option value="">— Seleziona squadra —</option>
              {squadre.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome_squadra}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-white/70">Partecipante che ha fatto l’azione</label>
            <select
              className="w-full mt-1 rounded-xl bg-neutral-900 border border-white/10 px-3 py-3"
              value={partecipanteId}
              onChange={(e) => setPartecipanteId(e.target.value)}
            >
              <option value="">— Seleziona partecipante —</option>
              {partecipanti.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-white/70">Azione (bonus/malus)</label>
            <select
              className="w-full mt-1 rounded-xl bg-neutral-900 border border-white/10 px-3 py-3"
              value={azioneId}
              onChange={(e) => setAzioneId(e.target.value)}
            >
              <option value="">— Seleziona azione —</option>
              {azioni.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.punti > 0 ? "+" : ""}
                  {a.punti})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-white/70">Note (opzionale)</label>
            <input
              className="w-full mt-1 rounded-xl bg-neutral-900 border border-white/10 px-3 py-3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. durante la roda serale…"
            />
          </div>

          <button className="rounded-xl bg-white text-black px-4 py-2 font-semibold">
            Registra evento
          </button>
        </form>
      </div>
    </main>
  );
}