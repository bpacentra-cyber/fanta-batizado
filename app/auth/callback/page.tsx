// app/auth/callback/page.tsx
import { Suspense } from "react";
import ClientCallback from "./ClientCallback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/80">
            Sto completando il login…
          </div>
        </main>
      }
    >
      <ClientCallback />
    </Suspense>
  );
}
