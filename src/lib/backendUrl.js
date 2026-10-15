/** Express origin with no trailing slash, so `/api/...` is never doubled. */
export function backendOrigin() {
  return (process.env.BACKEND_URL || "https://job-maanagenement-backend-3.onrender.com").replace(/\/+$/, "");
}

export function backendUrl(path) {
  const origin = backendOrigin();
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${suffix}`;
}
