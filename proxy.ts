// proxy.ts (Next.js 16) — NON blocca nessuna route
import { NextResponse, type NextRequest } from "next/server";

export default function proxy(_request: NextRequest) {
  // Lascia passare tutto. L'accesso protetto lo gestiscono le singole pagine lato client.
  return NextResponse.next();
}

// Facoltativo: se vuoi proprio limitarlo (ma va bene anche senza)
// export const config = { matcher: ["/:path*"] };
