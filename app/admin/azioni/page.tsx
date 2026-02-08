"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Azione = { id: string; nome: string; punti: number };

export default function AdminAzioniPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [azioni, setAzioni] = useState<Azione[]>([]);
  const [nome, setNome] = useState("");
  const [punti, setPunti] = useState<string>("");

  async function load() {
    setErr("");
    setOk("");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!prof?.is_admin) {
      router.replace("/squadre");
      return;
    }

    const { data, error } = await supabase
      .from("azioni")
      .select("id, nome, punti")
      .order("punti", { ascending: false });

    if (error) {
      setErr(error.message);
      return;
    }

    setAzioni((data ?? []) as Azione[]);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    const p = Number(punti);
    if (!nome.trim()) return setErr("Inserisci un nome azione.");
    if (!Number.isFinite(p)) return setErr("Punti non validi (es. 10 o -15).");

    const { error } = await supabase.from("azioni").insert({
      nome: nome.trim(),
      punti: p,
    });

    if (error) return setErr(error.message);

    setNome("");
    setPunti("");
    setOk("✅ Azione aggiunta.");
    await load();
  }

  async function del(id: string) {
    setErr("");
    setOk("");
    const { error } = await supabase.from("azioni").delete().eq("id", id);
    if (error) return setErr(error.message);
    setOk("🗑️ Azione eliminata.");
    await load();
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin · Azioni</h1>
          <div className="flex gap-2">
            <a className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/5" href="/azioni">
              Vista pubblica
            </a>
            <a className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/5" href="/admin/log">
              Log eventi
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

        <form onSubmit={add} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="sm:col-span-2 rounded-xl bg-neutral-900 border border-white/10 px-3 py-3"
              placeholder="Nome azione (es. Fa 3 au sem mão)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <input
              className="rounded-xl bg-neutral-900 border border-white/10 px-3 py-3"
              placeholder="Punti (es. 20 o -10)"
              value={punti}
              onChange={(e) => setPunti(e.target.value)}
            />
          </div>
          <button className="rounded-xl bg-white text-black px-4 py-2 font-semibold">
            Aggiungi
          </button>
        </form>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
          {azioni.length === 0 ? (
            <p className="text-white/70">Nessuna azione ancora.</p>
          ) : (
            azioni.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <div>
                  <div className="font-medium">{a.nome}</div>
                  <div className="text-sm text-white/60">
                    {a.punti > 0 ? "+" : ""}
                    {a.punti} Dbr
                  </div>
                </div>
                <button
                  className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/5"
                  onClick={() => del(a.id)}
                  type="button"
                >
                  Elimina
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}