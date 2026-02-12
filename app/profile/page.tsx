"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  is_admin?: boolean | null;
  is_founder?: boolean | null;
};

function safeInitials(name?: string | null) {
  const n = (name || "").trim();
  if (!n) return "👤";
  return n.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [nome, setNome] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);

  async function loadProfile() {
    setErr(null);
    setOk(null);
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, avatar_url, is_admin, is_founder")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setErr(error.message);
      setProfile(null);
      setNome("");
    } else {
      const p = (data as ProfileRow) ?? null;
      setProfile(p);
      setNome(p?.nome ?? "");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvaNome() {
    setErr(null);
    setOk(null);

    const clean = nome.trim();
    if (!clean) {
      setErr("Inserisci un nome valido.");
      return;
    }

    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ nome: clean })
        .eq("id", user.id);

      if (error) throw error;

      setOk("Nome aggiornato ✅");
      await loadProfile();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante il salvataggio del nome.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFoto(file: File) {
    setErr(null);
    setOk(null);
    setBusy(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // Bucket che stai usando tu
      const BUCKET = "partecipanti";

      // path unico (così non sovrascrivi e non incasini cache)
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      // Upload
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (upErr) throw upErr;

      // Public URL (bucket pubblico)
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error("Impossibile ottenere publicUrl della foto.");

      // Aggiorna profiles.avatar_url
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (dbErr) throw dbErr;

      setOk("Foto aggiornata ✅");
      await loadProfile();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l'upload.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">👤 Profilo</h1>
            <p className="mt-2 text-white/70">
              Aggiorna nome e foto (serve login).
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Home
          </button>
        </div>

        {err ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {ok ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            {ok}
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          {loading ? (
            <div className="text-white/70">Caricamento…</div>
          ) : (
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white/70">
                      {safeInitials(profile?.nome)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-white/60">Nome</div>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={busy}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm outline-none"
                    placeholder="Il tuo nome"
                  />

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={salvaNome}
                      disabled={busy || !nome.trim()}
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-40"
                    >
                      {busy ? "..." : "Salva nome"}
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    {profile?.is_admin ? "👑 Admin" : profile?.is_founder ? "🫡 Founder" : "Utente"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-bold">Carica foto</div>
                <div className="mt-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFoto(f);
                    }}
                    className="text-sm text-white/80"
                  />
                </div>
                <div className="mt-2 text-xs text-white/50">
                  Se non parte: è quasi sempre una policy storage mancante (SELECT/INSERT/UPDATE) o bucket non pubblico.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
