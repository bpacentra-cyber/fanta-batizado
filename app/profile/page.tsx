"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  user_id: string;
  nome: string | null;
  foto_url: string | null;
  is_admin: boolean | null;
  is_founder: boolean | null;
  created_at?: string;
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
  alt,
  fallback,
  size = 72,
}: {
  url: string | null | undefined;
  alt: string;
  fallback: string;
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-black/30"
      style={{ width: size, height: size }}
      title={alt}
    >
      {url ? (
        // next/image con URL esterna: se ti dà errore, dimmelo e lo switchiamo a <img>
        <Image src={url} alt={alt} fill className="object-cover" />
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
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [nome, setNome] = useState<string>("");
  const [fotoUrl, setFotoUrl] = useState<string>("");

  const isAdmin = !!profile?.is_admin;
  const showFounderBadge = !isAdmin && !!profile?.is_founder;

  const fallbackLetter = useMemo(() => {
    const base = (nome || profile?.nome || "U").trim();
    return (base[0] || "U").toUpperCase();
  }, [nome, profile?.nome]);

  async function loadProfile(uid: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, nome, foto_url, is_admin, is_founder, created_at")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) throw error;

    const p = (data || null) as ProfileRow | null;
    setProfile(p);

    setNome((p?.nome || "").toString());
    setFotoUrl((p?.foto_url || "").toString());
  }

  async function ensureFounderFlag() {
    // Se non abbiamo email o profilo, non facciamo nulla
    if (!userEmail || !userId) return;

    // Se sei admin, non ti mettiamo founder (richiesta tua)
    if (profile?.is_admin) return;

    // Se già founder, basta così
    if (profile?.is_founder) return;

    // Controllo allowlist
    const { data, error } = await supabase
      .from("founders_allowlist")
      .select("email, enabled")
      .eq("email", userEmail)
      .eq("enabled", true)
      .maybeSingle();

    // Se la tabella è protetta da RLS e non hai SELECT, qui potresti vedere errori.
    // In quel caso: dimmelo e ti do la policy SELECT per authenticated.
    if (error) {
      // Non blocchiamo la pagina: è un "nice to have"
      console.warn("Founder allowlist check error:", error.message);
      return;
    }

    if (!data) return; // non è founder

    // Aggiorna profilo
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ is_founder: true })
      .eq("user_id", userId);

    if (upErr) {
      console.warn("Founder flag update error:", upErr.message);
      return;
    }

    // Ricarica profilo per aggiornare badge UI
    await loadProfile(userId);
  }

  async function uploadAvatar(file: File) {
    // Bucket: avatars (tu l’hai già creato e reso pubblico)
    const bucket = "avatars";
    const path = `${userId}/${Date.now()}-${file.name}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data.publicUrl;
    setFotoUrl(publicUrl);
    return publicUrl;
  }

  async function saveProfile() {
    setErr("");
    setOk("");
    setSaving(true);

    try {
      const cleanNome = nome.trim();
      // Salvo nome + foto_url (fotoUrl può essere vuota)
      const payload: Partial<ProfileRow> = {
        nome: cleanNome || null,
        foto_url: fotoUrl?.trim() || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("user_id", userId);

      if (error) throw error;

      setOk("✅ Profilo salvato");
      await loadProfile(userId);

      // Dopo il salvataggio riproviamo anche sync founder (così basta un click “Salva” ai founder)
      await ensureFounderFlag();
    } catch (e: any) {
      setErr(e?.message ?? "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr("");
      setOk("");

      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!mounted) return;

      setUserId(user.id);
      setUserEmail((user.email || "").toLowerCase());

      try {
        await loadProfile(user.id);
      } catch (e: any) {
        setErr(e?.message ?? "Errore caricamento profilo.");
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Dopo che profile/email sono disponibili, proviamo l’auto-founder
  useEffect(() => {
    if (!userId || !userEmail) return;
    if (!profile) return;

    // non blocchiamo UI: best-effort
    ensureFounderFlag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail, profile?.is_admin, profile?.is_founder]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
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
                {isAdmin ? <Badge>👑 Admin Supremo</Badge> : null}
                {showFounderBadge ? <Badge>🫡 Founder</Badge> : null}
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Il tuo profilo
              </h1>

              <p className="text-white/70 leading-relaxed">
                Qui cambi nome e foto caposquadra. (La tua foto = caposquadra in Squadre/Classifica.)
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                ← Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-3xl px-6 pb-14 space-y-5">
        {err ? (
          <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            ❌ {err}
          </div>
        ) : null}

        {ok ? (
          <div className="rounded-[28px] border border-green-500/30 bg-green-500/10 p-5 text-green-100">
            {ok}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white/70">
            Caricamento…
          </div>
        ) : (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <div className="flex items-start gap-5">
              <Avatar
                url={fotoUrl || profile?.foto_url}
                alt={nome || profile?.nome || "Profilo"}
                fallback={fallbackLetter}
                size={84}
              />

              <div className="flex-1 space-y-4">
                <div>
                  <div className="text-xs text-white/60">Email</div>
                  <div className="mt-1 text-sm text-white/85">
                    {userEmail || "—"}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/60">Nome caposquadra</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30"
                    placeholder="Es. Amuleto"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">Foto profilo</label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={saving}
                      onChange={async (e) => {
                        setErr("");
                        setOk("");
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setSaving(true);
                          const url = await uploadAvatar(file);
                          setOk("✅ Foto caricata (ora salva il profilo).");
                          // Non salviamo automaticamente: ti lascio il controllo col tasto "Salva"
                          setFotoUrl(url);
                        } catch (ex: any) {
                          setErr(ex?.message ?? "Errore upload foto.");
                        } finally {
                          setSaving(false);
                          // reset input
                          e.currentTarget.value = "";
                        }
                      }}
                      className="text-sm text-white/75 file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white file:hover:bg-white/15"
                    />

                    {fotoUrl ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setFotoUrl("")}
                        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                      >
                        Rimuovi foto (non salva)
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    Tip: carica la foto → poi premi <b>Salva profilo</b>.
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
                  >
                    {saving ? "Salvataggio…" : "Salva profilo"}
                  </button>

                  <button
                    onClick={async () => {
                      setErr("");
                      setOk("");
                      try {
                        setSaving(true);
                        await loadProfile(userId);
                        setNome((profile?.nome || "").toString());
                        setFotoUrl((profile?.foto_url || "").toString());
                        setOk("↻ Ricaricato.");
                      } catch (ex: any) {
                        setErr(ex?.message ?? "Errore ricarica.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                  >
                    ↻ Ricarica
                  </button>
                </div>

                <div className="text-xs text-white/45">
                  Nota: i founder vengono riconosciuti automaticamente tramite <b>founders_allowlist</b>.
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </div>
    </main>
  );
}
