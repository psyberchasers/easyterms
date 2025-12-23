import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow password page and its API
  if (pathname === "/password" || pathname === "/api/password") {
    return NextResponse.next();
  }

  // Check for password cookie
  const authCookie = request.cookies.get("site_auth");

  if (authCookie?.value !== "true") {
    // Redirect to password page
    const url = request.nextUrl.clone();
    url.pathname = "/password";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Password verified, continue with normal session handling
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
