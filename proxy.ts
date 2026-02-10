// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: proxy.ts sostituisce middleware.ts
export function proxy(_req: NextRequest) {
  // Non facciamo nulla: lasciamo passare tutte le richieste
  return NextResponse.next();
}
