"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      setUserId(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", data.user.id)
        .single();

      setAvatarUrl(profile?.avatar_url || null);
    });
  }, []);

  async function uploadAvatar(file: File) {
    if (!userId) return;

    setUploading(true);
    setErr("");
    setMsg("");

    const ext = file.name.split(".").pop();
    const path = `${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("partecipanti")
      .upload(path, file, {
        upsert: true,
      });

    if (uploadError) {
      setErr(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("partecipanti")
      .getPublicUrl(path);

    const publicUrl = data.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setAvatarUrl(publicUrl);
    setMsg("✅ Foto aggiornata!");
    setUploading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-3xl font-extrabold">👤 Profilo</h1>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/60 font-bold">
                  Nessuna foto
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold">
                Carica foto
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar(file);
                }}
                className="mt-2 text-sm"
              />

              {uploading && (
                <div className="mt-2 text-xs text-white/60">
                  Upload in corso...
                </div>
              )}
            </div>
          </div>

          {msg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm">
              {msg}
            </div>
          )}

          {err && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm">
              {err}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
