import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/modules/auth/token";

// Optimistic check only: redirects visitors without a session cookie away from app pages.
// It does not validate the session (no database access here). Every page and API route
// validates the session again on the server.
//
// Logged-in users visiting /login are NOT redirected here, because a stale cookie would
// cause a redirect loop. The login page handles that case after validating the session.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/applications/:path*",
    "/interviews/:path*",
    "/habits/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/more/:path*",
  ],
};
