// app/auth/callback/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = false;

import { Suspense } from "react";
import ClientCallback from "./ClientCallback";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/80">
            Accesso in corso…
          </div>
        </div>
      }
    >
      <ClientCallback />
    </Suspense>
  );
}
