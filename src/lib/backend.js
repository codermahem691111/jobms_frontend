import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendUrl } from "@/lib/backendUrl";

// LAYER 2: server-side check inside the page itself.
// If the backend does not confirm the admin session, no dashboard HTML is produced.
export async function requireAdminData(path) {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) redirect("/admin/login");

  let payload = null;
  try {
    const res = await fetch(backendUrl(path), {
      headers: { cookie: `admin_token=${token}` },
      cache: "no-store",
    });
    if (res.ok) payload = await res.json();
  } catch {
    payload = null;
  }

  if (!payload?.success) redirect("/admin/login");
  return payload;
}
