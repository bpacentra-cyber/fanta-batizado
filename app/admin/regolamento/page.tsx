"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminRegolamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

      const ok = !!p?.is_admin;
      setLoading(false);

      if (!ok) router.replace("/regolamento");
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6 flex items-center justify-center">
        Controllo permessi admin…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">👑 Admin — Regolamento</h1>
          <Link
            href="/regolamento"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Torna al Regolamento
          </Link>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-white/80 leading-relaxed">
            Qui, per ora, il regolamento si modifica <b>nel codice</b> (è il modo più veloce e sicuro):
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
            File da modificare: <b>app/regolamento/page.tsx</b>
            <br />
            Cambia il testo → salva → refresh.
          </div>

          <p className="mt-4 text-sm text-white/60">
            Se vuoi, dopo facciamo l’upgrade: editor in-app + salvataggio su DB, sempre solo per Frodo.
          </p>
        </div>
      </div>
    </main>
  );
}
