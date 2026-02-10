"use client";

import Link from "next/link";
import React from "react";

export default function RegolamentoPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold">📜 Regolamento</h1>
          <div className="flex gap-2">
            <Link className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href="/">
              ← Home
            </Link>
            <Link className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href="/login">
              Vai al login →
            </Link>
          </div>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-white/75 leading-relaxed">
            Qui incolli il tuo regolamento completo. Questa pagina è pubblica e NON richiede login.
          </p>
        </section>
      </div>
    </main>
  );
}
