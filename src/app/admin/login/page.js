"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const field =
  "w-full rounded-xl border border-white/[0.10] bg-[#0D0D12] px-4 py-3.5 text-sm text-white placeholder:text-[#777782] outline-none transition-all duration-200 hover:border-red-500/40 focus:border-red-500 focus:ring-4 focus:ring-red-500/10";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data.message || "Access denied. Check your email and password."
        );
        setLoading(false);
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Server connection failed. Check whether the backend is running.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080B] px-4 py-12 text-white sm:px-6">
      {/* Red ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-red-600/[0.13] blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-red-900/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Security brand */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-lg shadow-red-950/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-red-500"
              aria-hidden="true"
            >
              <path
                d="M12 3 21 19H3L12 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M12 9v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>

          <div>
            <p className="text-lg font-extrabold tracking-tight">
              CONTROL<span className="text-red-500">.</span>
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#777782]">
              Administration console
            </p>
          </div>
        </div>

        {/* Login card */}
        <section className="rounded-[28px] border border-white/[0.09] bg-[#111116]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-9">
          {/* Restricted access badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.08] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-400">
              Restricted access
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[36px]">
            Admin sign in<span className="text-red-500">.</span>
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#9999A5]">
            Authenticate to access your company control panel. Authorized
            administrators only.
          </p>

          {/* Security notice */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.045] p-3.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
              aria-hidden="true"
            >
              <path
                d="M12 3 21 19H3L12 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M12 9v4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            <div>
              <p className="text-xs font-bold text-red-300">
                Secure administrator area
              </p>
              <p className="mt-1 text-xs leading-5 text-[#9999A5]">
                Unauthorized access is prohibited. Use your administrator
                credentials to continue.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold tracking-[0.12em] text-[#D5D5DE]"
              >
                ADMIN EMAIL
              </label>

              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#777782]"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="m4 7 8 6 8-6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@company.com"
                  className={`${field} pl-11`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold tracking-[0.12em] text-[#D5D5DE]"
              >
                PASSWORD
              </label>

              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#777782]"
                  aria-hidden="true"
                >
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="11"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`${field} pl-11 pr-16`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#888894] transition hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm leading-5 text-red-300"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M12 8v5m0 3h.01"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-red-400/20 bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/40 transition duration-200 hover:border-red-300/30 hover:bg-red-500 hover:shadow-red-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              {loading ? (
                <>
                  <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span className="relative">Verifying credentials...</span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative h-[18px] w-[18px]"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3 20 7v5c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V7l8-4Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m9 12 2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="relative">Sign in to dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.17em] text-[#666671]">
              Protected access
            </span>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-[#858590]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-red-400"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Administrator credentials required
          </div>
        </section>

        <div className="mt-7 text-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#92929E] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            >
              <path
                d="m15 18-6-6 6-6M9 12h11"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to member login
          </Link>
        </div>

        <p className="mt-5 text-center text-[10px] font-medium tracking-[0.18em] text-[#555560]">
          RESTRICTED AREA · AUTHORIZED PERSONNEL ONLY
        </p>
      </div>
    </main>
  );
}