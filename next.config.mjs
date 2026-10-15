const BACKEND = (process.env.BACKEND_URL || "https://job-maanagenement-backend-3.onrender.com").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Browser only talks to the Next.js origin; /api/* is proxied to Express.
  // This keeps the admin cookie on the same origin the middleware can read.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/api/:path*` }];
  },
  // Never cache admin pages (stops the back button showing the dashboard after logout)
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
