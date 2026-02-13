"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET = "partecipanti"; // se il bucket ha un altro nome, cambialo qui

type ProfileRow = {
  user_id: string;
  nome: string | null;
  foto_url: string | null;
  is_admin: boolean | null;
  is_founder: boolean | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

function Avatar({
  url,
  fallback,
}: {
  url: string | null | undefined;
  fallback: string;
}) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Avatar"
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/70 font-extrabold text-2xl">
          {fallback}
        </div>
      )}
      <div className="absolute inset-0 bg-black/15" />
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [nome, setNome] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fallback = useMemo(() => {
    const n = (nome || profile?.nome || "U").trim();
    return (n[0] || "U").toUpperCase();
  }, [nome, profile?.nome]);

  async function load() {
    setErr("");
    setOk("");
    setLoading(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      setErr(authErr.message);
      setLoading(false);
      return;
    }

    const uid = authData.user?.id;
    if (!uid) {
      setErr("Non sei autenticato. Vai su /login.");
      setLoading(false);
      return;
    }

    setUserId(uid);

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, nome, foto_url, is_admin, is_founder")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      setErr(error.message);
      setProfile(null);
      setNome("");
      setLoading(false);
      return;
    }

    // se non esiste riga, creala
    if (!data) {
      const { error: insErr } = await supabase
        .from("profiles")
        .insert({ user_id: uid, nome: null, foto_url: null });

      if (insErr) {
        setErr(insErr.message);
        setLoading(false);
        return;
      }

      const { data: data2, error: e2 } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, is_admin, is_founder")
        .eq("user_id", uid)
        .maybeSingle();

      if (e2) {
        setErr(e2.message);
        setLoading(false);
        return;
      }

      setProfile((data2 as ProfileRow) || null);
      setNome((data2?.nome as string) || "");
    } else {
      setProfile(data as ProfileRow);
      setNome((data.nome as string) || "");
    }

    setLoading(false);
  }

  async function saveNome() {
    setErr("");
    setOk("");
    if (!userId) return;

    const clean = nome.trim();
    if (clean.length < 2) {
      setErr("Inserisci un nome (min 2 caratteri).");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome: clean })
      .eq("user_id", userId);

    if (error) setErr(error.message);
    else {
      setOk("✅ Nome aggiornato!");
      setProfile((p) => (p ? { ...p, nome: clean } : p));
    }
    setSaving(false);
  }

  async function uploadFoto() {
    setErr("");
    setOk("");
    if (!userId) return;

    if (!file) {
      setErr("Seleziona un file immagine prima di caricare.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErr("Il file deve essere un'immagine (jpg/png/webp).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErr("Immagine troppo grande (max 5MB).");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}.${ext}`;
    const path = `${userId}/${filename}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setErr(`Upload fallito: ${upErr.message}`);
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl || "";

    if (!publicUrl) {
      setErr("Upload ok ma non riesco a generare la public URL.");
      setUploading(false);
      return;
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ foto_url: publicUrl })
      .eq("user_id", userId);

    if (updErr) setErr(`Foto caricata, ma update profilo fallito: ${updErr.message}`);
    else {
      setOk("✅ Foto aggiornata!");
      setProfile((p) => (p ? { ...p, foto_url: publicUrl } : p));
      setFile(null);
    }

    setUploading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">👤 Profilo</h1>
            <p className="mt-2 text-white/65">
              Modifica nome e foto profilo (visibili in classifica / squadra).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.is_admin ? <Badge>👑 Admin</Badge> : null}
            {!profile?.is_admin && profile?.is_founder ? <Badge>🫡 Founder</Badge> : null}
          </div>
        </div>

        {err ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {ok ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {ok}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Caricamento…
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar url={profile?.foto_url} fallback={fallback} />

              <div className="flex-1 w-full space-y-4">
                <div>
                  <div className="text-sm text-white/70 mb-1">Nome</div>
                  <div className="flex gap-2">
                    <input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Es. Bruno"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/20"
                    />
                    <button
                      onClick={saveNome}
                      disabled={saving}
                      className="shrink-0 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
                    >
                      {saving ? "Salvo…" : "Salva"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-white/70 mb-2">Carica foto</div>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border file:border-white/15 file:bg-white/5 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/10"
                    />
                    <button
                      onClick={uploadFoto}
                      disabled={uploading}
                      className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
                    >
                      {uploading ? "Carico…" : "Carica"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/50">
                    JPG/PNG/WebP • max 5MB • salva dentro bucket: <b>{BUCKET}</b>
                  </p>
                </div>

                <button
                  onClick={load}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  ↻ Ricarica profilo
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-white/45">
          © Fanta Batizado • App by Instrutor Frodo
        </div>
      </div>
    </main>
  );
}
