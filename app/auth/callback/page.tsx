// app/auth/callback/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import ClientCallback from "./ClientCallback";

export default function AuthCallbackPage() {
  return <ClientCallback />;
}
