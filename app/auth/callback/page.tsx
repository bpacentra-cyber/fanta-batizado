// app/auth/callback/page.tsx
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ClientCallback from "./ClientCallback";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-center">
            <div className="text-xl font-extrabold">Auth Callback</div>
            <div className="mt-3 text-sm text-white/70">Caricamento…</div>
          </div>
        </div>
      }
    >
      <ClientCallback />
    </Suspense>
  );
}
