"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Palette: ink #0F1B2D · indigo #4338CA · mint #10B981 · mist #F4F6FB · line #DDE2EE
const field =
  "w-full rounded-xl border border-[#DDE2EE] bg-[#F8F9FC] px-4 py-2.5 text-[15px] text-[#0F1B2D] placeholder:text-[#9AA5B8] outline-none transition hover:border-[#C3CBDD] focus:border-[#4338CA] focus:bg-white focus:ring-4 focus:ring-[#4338CA]/15 disabled:cursor-not-allowed disabled:bg-[#EEF1F7] disabled:text-[#8A96AB]";

const label = "mb-1.5 block text-[13px] font-semibold text-[#2A3A52]";

const primaryBtn =
  "w-full rounded-xl bg-[#4338CA] py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(67,56,202,0.65)] transition hover:bg-[#3730A3] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA]";

const linkBtn =
  "font-semibold text-[#4338CA] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA] rounded";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F1B2D] shadow-[0_6px_16px_-6px_rgba(15,27,45,0.6)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 7h10a3 3 0 0 1 0 6H8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8 13h8a3 3 0 0 1 0 6H6" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[22px] font-extrabold tracking-[0.14em] text-[#0F1B2D]" style={{ fontFamily: "var(--fd-display)" }}>
        FLOWDESK
      </span>
    </div>
  );
}

function TaskPreview({ title, who, status, tone, className = "" }) {
  const tones = {
    todo: "bg-[#EEF1F7] text-[#4A5A73]",
    doing: "bg-[#E7E5FB] text-[#4338CA]",
    done: "bg-[#D9F5E8] text-[#0B7A53]",
  };
  return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border border-[#E3E8F2] bg-white px-4 py-3.5 shadow-[0_10px_30px_-18px_rgba(15,27,45,0.35)] ${className}`}>
      <div className="min-w-0">
        <p className="truncate text-[14.5px] font-semibold text-[#0F1B2D]">{title}</p>
        <p className="mt-0.5 text-[13px] text-[#6B7A92]">{who}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{status}</span>
    </div>
  );
}

export default function MemberAuth() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areasError, setAreasError] = useState("");

  // Area names for the register dropdown (same list the admin created)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/areas", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) setAreas(d.data);
        else setAreasError("Couldn't load areas of work.");
      })
      .catch(() => !cancelled && setAreasError("Can't reach the server. Make sure the backend is running."))
      .finally(() => !cancelled && setAreasLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  // Shared by login and register: send JSON, go to the team dashboard on success
  async function submit(path, payload, fallbackMessage) {
    setBusy(true);
    try {
      const res = await fetch(`/api/member/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || fallbackMessage);
        setBusy(false);
        return;
      }
      router.replace("/teamdashboard");
      router.refresh();
    } catch {
      setError("Can't reach the server. Make sure the backend is running.");
      setBusy(false);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    submit("login", { email: f.get("email"), password: f.get("password") }, "Login failed. Please try again.");
  }

  function handleRegister(e) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);

    const years = Number(f.get("yearsOfExperience"));
    if (!Number.isInteger(years) || years < 0 || years > 60) {
      return setError("Enter your years of experience as a whole number between 0 and 60.");
    }
    const password = String(f.get("password"));
    if (password.length < 8) return setError("Choose a password with at least 8 characters.");
    if (password !== f.get("confirm")) return setError("The two passwords don't match.");

    submit(
      "register",
      {
        name: f.get("name"),
        fatherName: f.get("fatherName"),
        email: f.get("email"),
        area: f.get("area"),
        yearsOfExperience: years,
        password,
      },
      "Registration failed. Please try again."
    );
  }

  const noAreas = !areasLoading && areas.length === 0;

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#F4F6FB] text-[#0F1B2D]"
      style={{
        "--fd-display": "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif",
        fontFamily: "'Manrope', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Manrope:wght@400;500;600;700;800&display=swap');`}</style>

      {/* soft background shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#4338CA]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-[#10B981]/10 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <Logo />
        <Link
          href="/admin/login"
          className="hidden rounded-full border border-[#DDE2EE] bg-white px-4 py-2 text-sm font-semibold text-[#2A3A52] transition hover:border-[#4338CA] hover:text-[#4338CA] sm:inline-block"
        >
          Admin login
        </Link>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-10 md:min-h-[calc(100vh-96px)] md:grid-cols-[1.05fr_1fr] md:gap-16">
        <section>
          <h1
            className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-[56px]"
            style={{ fontFamily: "var(--fd-display)" }}
          >
            Every task has an owner and a status.
          </h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[#4A5A73]">
            Team leaders hand out work, members report back, and the admin sees the whole company at a glance.
          </p>

          <div className="mt-10 hidden max-w-md space-y-3 md:block" aria-hidden="true">
            <TaskPreview title="Prepare client proposal" who="Assigned by your team leader" status="To do" tone="todo" className="mr-10" />
            <TaskPreview title="Update weekly report" who="You · in progress" status="In progress" tone="doing" className="ml-6" />
            <TaskPreview title="Review site checklist" who="You · reported back" status="Done" tone="done" className="mr-4" />
          </div>
        </section>

        <section className="rounded-3xl border border-[#E3E8F2] bg-white p-7 shadow-[0_30px_70px_-30px_rgba(15,27,45,0.35)] sm:p-9">
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#EEF1F7] p-1" role="tablist">
            {["login", "register"].map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-lg py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338CA] ${
                  mode === m ? "bg-white text-[#0F1B2D] shadow-sm" : "text-[#6B7A92] hover:text-[#2A3A52]"
                }`}
              >
                {m === "login" ? "Member login" : "Member register"}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={label} htmlFor="l-email">Email</label>
                <input id="l-email" name="email" type="email" required className={field} autoComplete="email" placeholder="you@company.com" />
              </div>
              <div>
                <label className={label} htmlFor="l-password">Password</label>
                <input id="l-password" name="password" type="password" required className={field} autoComplete="current-password" />
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-[#FDD5D0] bg-[#FEF3F2] px-3.5 py-2.5 text-sm text-[#B42318]">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy ? "Signing in…" : "Log in as member"}
              </button>

              <p className="text-sm text-[#6B7A92]">
                First time here?{" "}
                <button type="button" onClick={() => switchMode("register")} className={linkBtn}>
                  Register
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="rounded-xl bg-[#F1F0FD] px-4 py-3 text-sm leading-relaxed text-[#3B3A8F]">
                Enter the same details your admin added for you, then choose a password. You&apos;ll use your email and this password to log in next time.
              </p>

              <div>
                <label className={label} htmlFor="r-name">Full name</label>
                <input id="r-name" name="name" required minLength={2} maxLength={80} className={field} autoComplete="name" />
              </div>
              <div>
                <label className={label} htmlFor="r-father">Father&apos;s name</label>
                <input id="r-father" name="fatherName" required minLength={2} maxLength={80} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="r-email">Email</label>
                <input id="r-email" name="email" type="email" required className={field} autoComplete="email" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="r-area">Area of expertise</label>
                  <select id="r-area" name="area" required defaultValue="" disabled={areasLoading || noAreas} className={field}>
                    <option value="" disabled>
                      {areasLoading ? "Loading…" : noAreas ? "No areas available" : "Select an area"}
                    </option>
                    {areas.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="r-years">Years of experience</label>
                  <input id="r-years" name="yearsOfExperience" type="number" min={0} max={60} step={1} required className={field} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="r-password">Choose a password</label>
                  <input id="r-password" name="password" type="password" required minLength={8} maxLength={128} className={field} autoComplete="new-password" />
                </div>
                <div>
                  <label className={label} htmlFor="r-confirm">Confirm password</label>
                  <input id="r-confirm" name="confirm" type="password" required minLength={8} maxLength={128} className={field} autoComplete="new-password" />
                </div>
              </div>
              <p className="-mt-2 text-xs text-[#6B7A92]">At least 8 characters.</p>

              {areasError && (
                <p role="alert" className="rounded-lg border border-[#FDD5D0] bg-[#FEF3F2] px-3.5 py-2.5 text-sm text-[#B42318]">
                  {areasError}
                </p>
              )}
              {error && (
                <p role="alert" className="rounded-lg border border-[#FDD5D0] bg-[#FEF3F2] px-3.5 py-2.5 text-sm text-[#B42318]">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy || areasLoading || noAreas} className={primaryBtn}>
                {busy ? "Checking your details…" : "Register"}
              </button>
            </form>
          )}

          <div className="mt-7 border-t border-[#E9EDF4] pt-5 text-sm text-[#6B7A92]">
            Managing the company?{" "}
            <Link href="/admin/login" className={linkBtn}>
              Admin login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}