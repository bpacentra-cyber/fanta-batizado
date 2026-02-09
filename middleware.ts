import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth");

  const supabaseSession = req.cookies.get("sb-access-token");

  // NON loggato → sempre login
  if (!supabaseSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // loggato → se va su login lo mando alla home
  if (supabaseSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
