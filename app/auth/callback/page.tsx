// app/auth/callback/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import ClientCallback from "./ClientCallback";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-lg font-extrabold">Auth Callback</div>
            <div className="mt-2 text-white/70 text-sm">Sto completando il login…</div>
          </div>
        </main>
      }
    >
      <ClientCallback />
    </Suspense>
  );
}
