"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase env mancanti: controlla NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local / Vercel env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ questo fa restare la sessione salvata tra chiusure/aperture
    persistSession: true,
    // ✅ rinnova il token in automatico
    autoRefreshToken: true,
    // ✅ utile per magic link / callback (se usi exchange o detect url)
    detectSessionInUrl: true,
    // ✅ chiave stabile (evita casini se cambi file/nome client)
    storageKey: "fanta-batizado-auth",
  },
});
