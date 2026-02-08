"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AzioneRow = {
  id: string;
  nome: string | null;
  descrizione: string | null;
  codice: string | null;
  punti: number | null;
  is_active: boolean | null;
  created_at?: string | null;
};

type ProfileMini = {
  user_id: string;
  is_admin: boolean | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

function PointsPill({ punti }: { punti: number }) {
  const bonus = punti >= 0;
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-extrabold",
        bonus
          ? "bg-green-500/10 text-green-200 border-green-500/20"
          : "bg-red-500/10 text-red-200 border-red-500/20",
      ].join(" ")}
    >
      {bonus ? `+${punti}` : `${punti}`}
    </span>
  );
}

export default function AzioniPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [rows, setRows] = useState<AzioneRow[]>([]);

  // form admin
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [codice, setCodice] = useState("");
  const [punti, setPunti] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  async function loadAdminFlag() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data: p, error } = await supabase
      .from("profiles")
      .select("user_id, is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(!!(p as ProfileMini | null)?.is_admin);
  }

  async function loadAzioni() {
    setErr("");
    setLoading(true);

    try {
      // Se non admin: solo attive
      const q = supabase
        .from("azioni")
        .select("id, nome, descrizione, codice, punti, is_active, created_at")
        .order("punti", { ascending: false })
        .order("nome", { ascending: true });

      const { data, error } = isAdmin ? await q : await q.eq("is_active", true);

      if (error) throw error;
      setRows((data || []) as AzioneRow[]);
    } catch (e: any) {
      setErr(e?.message ?? "Errore caricamento azioni.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadAdminFlag();
    })();
  }, []);

  useEffect(() => {
    loadAzioni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // realtime: se cambia la tabella azioni, ricarica
  useEffect(() => {
    const ch = supabase
      .channel("rt:azioni")
      .on("postgres_changes", { event: "*", schema: "public", table: "azioni" }, () => {
        loadAzioni();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function resetForm() {
    setEditId(null);
    setNome("");
    setDescrizione("");
    setCodice("");
    setPunti(0);
    setIsActive(true);
  }

  function startEdit(r: AzioneRow) {
    setEditId(r.id);
    setNome(r.nome ?? "");
    setDescrizione(r.descrizione ?? "");
    setCodice(r.codice ?? "");
    setPunti(r.punti ?? 0);
    setIsActive(r.is_active ?? true);
  }

  async function save() {
    setErr("");

    const payload = {
      nome: nome.trim() || null,
      descrizione: descrizione.trim() || null,
      codice: codice.trim() || null,
      punti,
      is_active: isActive,
    };

    try {
      if (!payload.codice) {
        setErr("❌ Il campo 'codice' è obbligatorio.");
        return;
      }
      if (!payload.nome) {
        setErr("❌ Il campo 'nome' è obbligatorio.");
        return;
      }

      if (!editId) {
        const { error } = await supabase.from("azioni").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("azioni").update(payload).eq("id", editId);
        if (error) throw error;
      }

      resetForm();
    } catch (e: any) {
      setErr(e?.message ?? "Errore salvataggio.");
    }
  }

  async function toggleActive(r: AzioneRow) {
    setErr("");
    try {
      const next = !(r.is_active ?? true);
      const { error } = await supabase.from("azioni").update({ is_active: next }).eq("id", r.id);
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message ?? "Errore toggle attivo.");
    }
  }

  async function softDelete(r: AzioneRow) {
    setErr("");
    try {
      // soft delete: disattiva (evita FK su log_azioni)
      const { error } = await supabase.from("azioni").update({ is_active: false }).eq("id", r.id);
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message ?? "Errore eliminazione (soft).");
    }
  }

  const activeCount = useMemo(() => rows.filter((r) => r.is_active).length, [rows]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>⚡ Azioni</Badge>
                <Badge>{isAdmin ? "Admin mode" : "Solo lettura"}</Badge>
                <Badge>Attive: {activeCount}</Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Bonus & Malus
              </h1>
              <p className="text-white/70 leading-relaxed">
                Lista delle azioni che possono capitare durante il Batizado.
                {isAdmin ? " Tu puoi modificarle." : " Non puoi modificarle."}
              </p>
            </div>

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
              >
                ↻ Aggiorna
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-5xl px-6 pb-14 space-y-6">
        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {/* ADMIN FORM */}
        {isAdmin ? (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {editId ? "✏️ Modifica azione" : "➕ Aggiungi azione"}
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  Gli altri vedono solo le azioni attive.
                </p>
              </div>

              <div className="flex gap-2">
                {editId ? (
                  <button
                    onClick={resetForm}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    Annulla
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Nome</div>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Es. ‘Cade in roda’"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Codice (obbligatorio)</div>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  value={codice}
                  onChange={(e) => setCodice(e.target.value)}
                  placeholder="Es. A01"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                <div className="text-xs text-white/60">Descrizione</div>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Testo breve e chiaro… (o goliardico)"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Punti</div>
                <input
                  type="number"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  value={punti}
                  onChange={(e) => setPunti(Number(e.target.value))}
                />
                <div className="mt-2">
                  <PointsPill punti={punti} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Attiva</div>
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  is_active = {isActive ? "true" : "false"}
                </label>

                <button
                  onClick={save}
                  className="mt-3 w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                >
                  {editId ? "Salva modifiche" : "Crea azione"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* LISTA AZIONI */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">📋 Lista Azioni</h2>
              <p className="mt-1 text-sm text-white/65">
                {isAdmin
                  ? "Admin vede tutto (attive + inattive)."
                  : "Visibili solo le azioni attive."}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 text-white/70">Caricamento…</div>
          ) : rows.length === 0 ? (
            <div className="mt-4 text-white/70">Nessuna azione (ancora).</div>
          ) : (
            <div className="mt-4 space-y-3">
              {rows.map((r) => {
                const p = r.punti ?? 0;
                const active = r.is_active ?? true;

                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-extrabold truncate">
                            {r.nome ?? "—"}
                          </div>
                          {r.codice ? (
                            <span className="text-xs text-white/55 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                              {r.codice}
                            </span>
                          ) : null}
                          {!active ? <Badge>Inattiva</Badge> : null}
                        </div>
                        {r.descrizione ? (
                          <div className="mt-1 text-sm text-white/65 leading-snug">
                            {r.descrizione}
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <PointsPill punti={p} />

                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(r)}
                              className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                            >
                              Modifica
                            </button>
                            <button
                              onClick={() => toggleActive(r)}
                              className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                            >
                              {active ? "Disattiva" : "Attiva"}
                            </button>
                            <button
                              onClick={() => softDelete(r)}
                              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100 hover:bg-red-500/15"
                              title="Soft delete: mette is_active=false (sicuro con FK log_azioni)"
                            >
                              Elimina
                            </button>
                          </div>
                        ) : null}
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
      </div>
    </main>
  );
}
