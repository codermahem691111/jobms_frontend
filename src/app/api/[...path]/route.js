import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/backendUrl";

export const dynamic = "force-dynamic";

const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
  "content-encoding",
]);

async function proxy(request, context) {
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const target = backendUrl(`/api/${path.join("/")}${incoming.search}`);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const init = { method: request.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { success: false, message: "Can't reach the server. Make sure the backend is running." },
      { status: 502 }
    );
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP.has(key.toLowerCase()) || key.toLowerCase() === "set-cookie") return;
    out.set(key, value);
  });
  const cookies =
    typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  for (const cookie of cookies) out.append("set-cookie", cookie);

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
