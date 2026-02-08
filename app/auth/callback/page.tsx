// app/auth/callback/page.tsx

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; next?: string };
}) {
  const code = typeof searchParams?.code === "string" ? searchParams.code : "";
  const next = typeof searchParams?.next === "string" ? searchParams.next : "/";

  // NOTA: niente useSearchParams(), quindi niente errore build
  return <ClientCallback code={code} nextUrl={next} />;
}

import ClientCallback from "./ClientCallback";
