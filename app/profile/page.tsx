"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function ProfilePage() {
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [user, setUser] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Caricamento...");
  const [uploading, setUploading] = useState(false);

  // ✅ Aggancia sessione (così NON rimani “anonimo” su Vercel)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error) {
        console.log("auth.getUser error:", error);
        setStatus("Errore auth. Apri console.");
        return;
      }

      if (!user) {
        setUser(null);
        setStatus("Non sei loggato. Vai su /login e rientra col magic link.");
        return;
      }

      setUser(user);
      setStatus("Utente ok. Carico profilo...");

      const { data, error: profErr } = await supabase
        .from("profiles")
        .select("foto_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profErr) {
        console.log("Errore fetch profiles:", profErr);
        setStatus("Bloccato su profiles (RLS). Fai STEP 2 su Supabase.");
        return;
      }

      setFotoUrl(data?.foto_url ?? null);
      setStatus("Profilo pronto ✅");
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const uploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!user) {
        alert("NON SEI LOGGATO. Vai su /login e rientra col magic link.");
        return;
      }

      setUploading(true);
      setStatus("Upload in corso...");

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}-${Date.now()}.${ext}`;

      // ✅ upload su bucket avatars
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.log("Upload error:", uploadError);
        alert("UPLOAD BLOCCATO (storage policy). Vedi console.");
        setStatus("Upload bloccato (storage policy).");
        return;
      }

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = pub.publicUrl;

      // ✅ salva su DB: UPSERT (se la riga non esiste la crea)
      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, foto_url: publicUrl },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        console.log("Upsert profiles error:", upsertErr);
        alert("DB BLOCCATO (profiles RLS). Fai STEP 2 su Supabase.");
        setStatus("DB bloccato (profiles RLS).");
        return;
      }

      setFotoUrl(publicUrl);
      setStatus("Foto aggiornata ✅");
    } catch (e) {
      console.log("Errore generale:", e);
      alert("Errore generale. Apri console.");
      setStatus("Errore generale.");
    } finally {
      setUploading(false);
      // reset input (così puoi ricaricare lo stesso file)
      event.target.value = "";
    }
  };

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>👤 Profilo</h1>
      <p style={{ opacity: 0.8, marginBottom: 20 }}>{status}</p>

      <div
        style={{
          background: "#1a1a1a",
          padding: 20,
          borderRadius: 16,
          width: 420,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt="avatar"
              style={{
                width: 100,
                height: 100,
                borderRadius: 16,
                objectFit: "cover",
                background: "#111",
              }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 16,
                background: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Nessuna foto
            </div>
          )}

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Carica foto</div>
            <input type="file" accept="image/*" onChange={uploadFoto} />
            {uploading && <div style={{ marginTop: 8 }}>Uploading...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
