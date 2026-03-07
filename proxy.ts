import { NextRequest, NextResponse } from "next/server";
import { verifyCookie } from "./lib/auth";

const PUBLIC_PATHS = ["/", "/api/auth", "/_next", "/favicon.ico"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check auth cookie
  const cookie = request.cookies.get("bizreq_auth");
  if (!cookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const result = verifyCookie(cookie.value);
  if (!result.valid) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("bizreq_auth");
    return response;
  }

  const role = result.role;

  // Role-based access control
  if (role === "biz") {
    if (
      pathname.startsWith("/chat") ||
      pathname.startsWith("/api/chat") ||
      pathname.startsWith("/request") ||
      pathname.startsWith("/api/requests") ||
      pathname.startsWith("/api/comments")
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (role === "plan") {
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api/requests") ||
      pathname.startsWith("/api/comments") ||
      pathname.startsWith("/request")
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
