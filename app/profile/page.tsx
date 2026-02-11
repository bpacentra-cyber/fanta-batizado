"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

function Avatar({ url, fallback }: { url: string | null | undefined; fallback: string }) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Foto profilo" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white/70">
          {fallback}
        </div>
      )}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [nome, setNome] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fallback = useMemo(() => {
    const n = nome?.trim() || profile?.nome?.trim() || "U";
    return (n[0] || "U").toUpperCase();
  }, [nome, profile?.nome]);

  async function loadProfile() {
    setErr("");
    setMsg("");
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, nome, foto_url, is_admin, is_founder")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      setErr(error.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!data) {
      const { error: insErr } = await supabase.from("profiles").insert({
        user_id: user.id,
        nome: user.email?.split("@")[0] ?? "Utente",
      });

      if (insErr) {
        setErr(insErr.message);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: data2, error: err2 } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url, is_admin, is_founder")
        .eq("user_id", user.id)
        .single();

      if (err2) setErr(err2.message);
      else {
        setProfile(data2 as ProfileRow);
        setNome((data2?.nome ?? "").toString());
      }

      setLoading(false);
      return;
    }

    setProfile(data as ProfileRow);
    setNome((data.nome ?? "").toString());
    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveNameOnly() {
    setErr("");
    setMsg("");
    setSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return router.replace("/login");

      const clean = nome.trim();
      if (!clean) {
        setErr("Inserisci un nome valido 👀");
        return;
      }

      const { error } = await supabase.from("profiles").update({ nome: clean }).eq("user_id", user.id);
      if (error) throw error;

      setMsg("✅ Nome aggiornato!");
      await loadProfile();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhotoAndSave() {
    setErr("");
    setMsg("");
    if (!file) return setErr("Seleziona prima una foto 🙂");

    setSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return router.replace("/login");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: dbErr } = await supabase.from("profiles").update({ foto_url: publicUrl }).eq("user_id", user.id);
      if (dbErr) throw dbErr;

      setMsg("✅ Foto aggiornata!");
      setFile(null);
      await loadProfile();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante l’upload.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-56 right-[-120px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-3xl px-6 pt-10 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>👤 Profilo</Badge>
                {profile?.is_admin ? <Badge>👑 Admin</Badge> : null}
                {!profile?.is_admin && profile?.is_founder ? <Badge>🫡 Founder</Badge> : null}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Il tuo profilo</h1>
              <p className="text-white/70 leading-relaxed">Cambia nome e foto caposquadra.</p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Link href="/" className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                ← Home
              </Link>
              <Link href="/mercato" className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
                Vai al Mercato
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 pb-14 space-y-5">
        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">❌ {err}</div>
        ) : null}

        {msg ? (
          <div className="rounded-[28px] border border-green-500/30 bg-green-500/10 p-5 text-green-100">{msg}</div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">Caricamento…</div>
        ) : (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <div className="flex items-start gap-5">
              <Avatar url={profile?.foto_url} fallback={fallback} />

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm text-white/75">Nome caposquadra</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/20"
                    placeholder="Es. Amuleto"
                  />
                  <button
                    onClick={saveNameOnly}
                    disabled={saving}
                    className="mt-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
                  >
                    {saving ? "Salvo…" : "Salva nome"}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-extrabold">📸 Foto profilo</div>

                  <input
                    type="file"
                    accept="image/*"
                    className="mt-3 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-white/90"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />

                  <button
                    onClick={uploadPhotoAndSave}
                    disabled={saving}
                    className="mt-3 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
                  >
                    {saving ? "Carico…" : "Carica foto"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
