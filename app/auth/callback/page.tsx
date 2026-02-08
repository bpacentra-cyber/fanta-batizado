// app/auth/callback/page.tsx
import ClientCallback from "./ClientCallback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; next?: string };
}) {
  const code = typeof searchParams?.code === "string" ? searchParams.code : "";
  const nextUrl = typeof searchParams?.next === "string" ? searchParams.next : "/";

  return <ClientCallback code={code} nextUrl={nextUrl} />;
}
