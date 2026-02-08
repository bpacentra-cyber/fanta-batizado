// app/auth/callback/page.tsx
import { Suspense } from "react";
import ClientCallback from "./ClientCallback";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-white">Redirect…</div>}>
      <ClientCallback />
    </Suspense>
  );
}
