"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function ProgressBar({ percent, label }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2.5 w-full overflow-hidden rounded-full bg-[#E3E8ED]"
    >
      <div className="h-full rounded-full bg-[#1F7A63] transition-[width] duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
}

const formatSize = (bytes) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const extOf = (name) => (name && name.includes(".") ? name.split(".").pop().slice(0, 4) : "file");

const linkButton =
  "shrink-0 rounded-lg border border-[#C9D1D9] px-3.5 py-2 text-sm font-semibold transition hover:bg-[#F3F5F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F7A63]";

// One file or link shared by the team leader
function ResourceItem({ r, date }) {
  const name = r.title || r.fileName || hostOf(r.url);
  const fileUrl = `/api/member/resources/${r._id}/file`;

  return (
    <li className="flex items-center gap-4 py-3.5">
      {r.isImage ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl} alt={name} loading="lazy" className="h-14 w-14 rounded-lg border border-[#E3E8ED] object-cover" />
        </a>
      ) : (
        <div aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#EEF1F4] text-xs font-extrabold uppercase text-[#4A5A6A]">
          {r.kind === "link" ? "Link" : extOf(r.fileName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-xs text-[#5B6B7B]">
          {r.kind === "link" ? hostOf(r.url) : `${r.fileName} · ${formatSize(r.fileSize)}`}
          {r.sharedBy ? ` · Shared by ${r.sharedBy}` : ""} · {date(r.createdAt)}
        </p>
      </div>

      {r.kind === "link" ? (
        <a href={r.url} target="_blank" rel="noopener noreferrer" className={linkButton}>Open link</a>
      ) : r.isImage ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={linkButton}>View</a>
      ) : (
        <a href={fileUrl} download className={linkButton}>Download</a>
      )}
    </li>
  );
}

export default function TeamDashboardPage() {
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ total: 0, done: 0, percent: 0 });
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [resources, setResources] = useState(null); // null while loading
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/member/tasks", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.href = "/"; // no valid member session
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setTasks(data.data.tasks);
      setProgress(data.data.progress);
      setTasksLoaded(true);
      setError("");
    } catch (err) {
      setError(err.message || "Can't reach the server.");
    }
  }, []);

  const loadResources = useCallback(async () => {
    try {
      const res = await fetch("/api/member/resources", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      if (res.ok) setResources(data.data);
    } catch {
      // keep what is on screen; the next refresh will try again
    }
  }, []);

  useEffect(() => {
    fetch("/api/member/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Something went wrong");
        setMember(data.data);
      })
      .catch((err) => setError(err.message || "Can't reach the server."));

    loadTasks();
    loadResources();
    // New work and files from the team leader show up without a manual refresh
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadTasks();
        loadResources();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [loadTasks, loadResources]);

  async function toggle(task) {
    setBusyId(task._id);
    setError("");
    try {
      const res = await fetch(`/api/member/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ done: !task.done }),
      });
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't update this work");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    await fetch("/api/member/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/");
    router.refresh();
  }

  // Unfinished work first
  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
  const date = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen">
      <header className="bg-[#0E1B2C]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <h1 className="text-xl font-extrabold text-white">Team dashboard</h1>
          <div className="flex items-center gap-3">
            {member?.isTeamLeader && (
              <Link
                href="/teamleaderdashboard"
                className="rounded-lg bg-[#4FC3A1] px-4 py-2 text-sm font-bold text-[#08241B] transition hover:bg-[#6AD3B4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Team leader dashboard
              </Link>
            )}
            <button
              onClick={logout}
              className="rounded-lg border border-[#3A4C63] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1B2E45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4FC3A1]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        {error && <p role="alert" className="text-sm text-[#B42318]">{error}</p>}

        {!member ? (
          !error && <p className="text-sm text-[#5B6B7B]">Loading…</p>
        ) : (
          <section className="rounded-xl border border-[#D5DCE3] bg-white p-7">
            <p className="text-sm font-medium text-[#5B6B7B]">Welcome</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{member.name}</p>
            <div className="mt-6 border-t border-[#E3E8ED] pt-5">
              <p className="text-sm font-medium text-[#5B6B7B]">Your field</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold text-[#175C4A]">
                {member.area ?? "—"}
                {member.isTeamLeader && (
                  <span className="rounded-full bg-[#E8F3EF] px-2.5 py-0.5 text-xs font-bold">Team leader</span>
                )}
              </p>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-[#D5DCE3] bg-white p-7">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-extrabold">My work</h2>
            {tasksLoaded && progress.total > 0 && (
              <p className="text-sm tabular-nums text-[#5B6B7B]">
                {progress.done} of {progress.total} done · <span className="font-bold text-[#14202E]">{progress.percent}%</span>
              </p>
            )}
          </div>

          {tasksLoaded && progress.total > 0 && (
            <div className="mt-3">
              <ProgressBar percent={progress.percent} label="My work progress" />
            </div>
          )}

          {!tasksLoaded ? (
            <p className="mt-5 text-sm text-[#5B6B7B]">Loading your work…</p>
          ) : sorted.length === 0 ? (
            <p className="mt-5 text-sm leading-relaxed text-[#5B6B7B]">
              No work assigned yet. When your team leader assigns you something, it will show up here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#EEF1F4]">
              {sorted.map((t) => (
                <li key={t._id} className="flex items-start gap-3 py-3.5">
                  <button
                    onClick={() => toggle(t)}
                    disabled={busyId === t._id}
                    aria-pressed={t.done}
                    aria-label={t.done ? `Mark "${t.title}" as not done` : `Mark "${t.title}" as done`}
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A63] ${
                      t.done
                        ? "border-[#1F7A63] bg-[#1F7A63] text-white"
                        : "border-[#9FB0C4] bg-white text-transparent hover:border-[#1F7A63]"
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  </button>
                  <div className="min-w-0">
                    <p className={`break-words text-[15px] ${t.done ? "text-[#5B6B7B] line-through" : "font-medium"}`}>{t.title}</p>
                    <p className="mt-0.5 text-xs text-[#5B6B7B]">
                      Assigned {date(t.createdAt)}
                      {t.done && t.doneAt ? ` · Done ${date(t.doneAt)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-[#D5DCE3] bg-white p-7">
          <h2 className="text-lg font-extrabold">Shared with your team</h2>
          <p className="mt-1 text-sm text-[#5B6B7B]">Files and links from your team leader. Only your team can see these.</p>

          {resources === null ? (
            <p className="mt-5 text-sm text-[#5B6B7B]">Loading…</p>
          ) : resources.length === 0 ? (
            <p className="mt-5 text-sm leading-relaxed text-[#5B6B7B]">Nothing shared yet. Files and links from your team leader will show up here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF1F4]">
              {resources.map((r) => (
                <ResourceItem key={r._id} r={r} date={date} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}