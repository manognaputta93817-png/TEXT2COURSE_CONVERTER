// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of protected routes
const protectedRoutes = ["/dashboard"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Example: check if user is logged in (you can integrate NextAuth JWT here)
  const token = req.cookies.get("next-auth.session-token"); // NextAuth default cookie

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    // Redirect to sign-in page if not logged in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

// Apply middleware only to certain paths (optional)
export const config = {
  matcher: ["/dashboard/:path*"],
};
