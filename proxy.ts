import { NextRequest, NextResponse } from "next/server";

// ✅ NON fare redirect qui. Deve essere neutro.
export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
