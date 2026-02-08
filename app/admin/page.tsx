"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // controllo profilo + admin
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_admin, nome")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setMsg("Errore Supabase: " + error.message);
        setLoading(false);
        return;
      }

      if (!profile) {
        router.replace("/profile");
        return;
      }

      if (!profile.is_admin) {
        router.replace("/squadre");
        return;
      }

      setMsg(`Benvenuto Admin ✅ (${profile.nome ?? "senza nome"})`);
      setLoading(false);
    };

    run();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <p className="text-white/70">Caricamento Admin...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Admin</h1>
      <p className="text-white/70 mb-6">{msg}</p>

      <div className="flex gap-3">
        <a
          className="rounded-xl bg-white text-black px-4 py-2 font-semibold"
          href="/squadre"
        >
          Vai a Squadre
        </a>
        <button
          className="rounded-xl border border-white/20 px-4 py-2"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          Logout
        </button>
      </div>

      <p className="mt-8 text-sm text-white/50">
        Prossimo step: qui mettiamo “crea evento / crea squadre / assegna budget”.
      </p>
    </main>
  );
}
