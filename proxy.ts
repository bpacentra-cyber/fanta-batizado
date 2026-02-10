import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Proxy file (sostituisce middleware.ts)
 * Compatibile con Next.js 16 + Vercel
 */

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 🔒 ESEMPIO SAFE: non blocca nulla, passa sempre avanti
  return NextResponse.next();
}

// Matcher standard
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
