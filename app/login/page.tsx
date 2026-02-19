"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setErr("");
    setMsg("");

    if (!email.includes("@")) {
      setErr("Inserisci una mail valida");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin, // 🔥 TORNA ALLA HOME
        },
      });

      if (error) throw error;

      setMsg("Controlla la mail e clicca il link per entrare 🚀");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 rounded-xl bg-white text-black font-bold"
        >
          {loading ? "Invio..." : "Entra"}
        </button>

        {msg && <p className="text-green-400">{msg}</p>}
        {err && <p className="text-red-400">{err}</p>}
      </div>
    </main>
  );
}
