import { NextResponse } from "next/server";

const PROTECTED_PREFIX = "/tools";

// Use a strong random string in Vercel env var: GHOSTSTACK_TOKEN
export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only protect /tools/*
  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  const expected = process.env.GHOSTSTACK_TOKEN;
  if (!expected) {
    // Fail closed if env var missing
    return new NextResponse("Access misconfigured.", { status: 503 });
  }

  // Check cookie set by the landing page (set in script.js below)
  const cookie = req.cookies.get("gs_access")?.value || "";

  if (cookie === expected) {
    return NextResponse.next();
  }

  // Deny: bounce back to home
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("denied", "1");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/tools/:path*"],
};