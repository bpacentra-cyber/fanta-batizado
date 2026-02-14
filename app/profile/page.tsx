"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🔹 CARICA UTENTE + PROFILO
  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("foto_url")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.log("Errore fetch profilo:", error);
      }

      if (data?.foto_url) {
        setFotoUrl(data.foto_url);
      }
    };

    getProfile();
  }, []);

  // 🔹 UPLOAD FOTO
  const uploadFoto = async (event: any) => {
    try {
      setUploading(true);

      const file = event.target.files[0];
      if (!file || !user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;

      // 🔹 upload su bucket avatars
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        alert("Errore upload!");
        console.log(uploadError);
        return;
      }

      // 🔹 prendi URL pubblico
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;

      // 🔹 salva nel database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ foto_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) {
        alert("Errore salvataggio DB!");
        console.log(updateError);
        return;
      }

      setFotoUrl(publicUrl);
    } catch (error) {
      console.log(error);
      alert("Errore generale");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>👤 Profilo</h1>

      <div
        style={{
          background: "#1a1a1a",
          padding: 20,
          borderRadius: 16,
          width: 350,
        }}
      >
        <div style={{ marginBottom: 15 }}>
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt="avatar"
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Nessuna foto
            </div>
          )}
        </div>

        <div>
          <p style={{ marginBottom: 10 }}>Carica foto</p>
          <input type="file" onChange={uploadFoto} />

          {uploading && <p>Uploading...</p>}
        </div>
      </div>
    </div>
  );
}
