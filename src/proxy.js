import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/backendUrl";

// Runs before a protected page is served. Asks the backend to verify the session
// on every request, and fails closed (backend down = no access).
async function verify(req, cookieName, endpoint) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return false;
  try {
    const res = await fetch(backendUrl(endpoint), {
      headers: { cookie: `${cookieName}=${token}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function proxy(req) {
  const { pathname } = req.nextUrl;

  // Team leader area: the backend must confirm this member is currently a team leader
  if (pathname.startsWith("/teamleaderdashboard")) {
    if (await verify(req, "member_token", "/api/member/leader/me")) return NextResponse.next();

    // A signed-in member who is not a team leader goes to their own dashboard
    if (await verify(req, "member_token", "/api/member/me")) {
      return NextResponse.redirect(new URL("/teamdashboard", req.url));
    }
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("member_token");
    return res;
  }

  // Team (member) area
  if (pathname.startsWith("/teamdashboard")) {
    if (!(await verify(req, "member_token", "/api/member/me"))) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.delete("member_token");
      return res;
    }
    return NextResponse.next();
  }

  // Admin area
  const isAdmin = await verify(req, "admin_token", "/api/admin/me");

  if (pathname.startsWith("/admin/dashboard")) {
    if (!isAdmin) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("admin_token");
      return res;
    }
    return NextResponse.next();
  }

  // Already signed in as admin? Skip the login page.
  if (pathname === "/admin/login" && isAdmin) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/login", "/teamdashboard/:path*", "/teamleaderdashboard/:path*"],
};