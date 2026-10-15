"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const field =
  "w-full rounded-lg border border-[#C9D1D9] bg-white px-3.5 py-2.5 text-[15px] outline-none transition focus:border-[#1F7A63] focus:ring-2 focus:ring-[#1F7A63]/25 disabled:bg-[#F3F5F7]";

function ProgressBar({ percent, label, large = false }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`w-full overflow-hidden rounded-full bg-[#E3E8ED] ${large ? "h-4" : "h-2.5"}`}
    >
      <div className="h-full rounded-full bg-[#1F7A63] transition-[width] duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

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

const smallButton =
  "shrink-0 rounded-lg border border-[#C9D1D9] px-3.5 py-2 text-sm font-semibold transition hover:bg-[#F3F5F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F7A63]";

// One shared file or link, with a button to remove it
function ResourceItem({ r, date, onRemove }) {
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
          {r.kind === "link" ? hostOf(r.url) : `${r.fileName} · ${formatSize(r.fileSize)}`} · {date(r.createdAt)}
        </p>
      </div>

      {r.kind === "link" ? (
        <a href={r.url} target="_blank" rel="noopener noreferrer" className={smallButton}>Open</a>
      ) : r.isImage ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={smallButton}>View</a>
      ) : (
        <a href={fileUrl} download className={smallButton}>Download</a>
      )}
      <button
        onClick={() => onRemove(r)}
        className="shrink-0 text-sm font-semibold text-[#B42318] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B42318]"
      >
        Remove
      </button>
    </li>
  );
}

export default function TeamLeaderDashboardPage() {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [resources, setResources] = useState(null); // null while loading
  const [shareMode, setShareMode] = useState("file");
  const [shareError, setShareError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/leader/team", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.href = "/"; // no valid session
        return;
      }
      if (res.status === 403) {
        window.location.href = "/teamdashboard"; // not (or no longer) a team leader
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setTeam(data.data);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || "Can't reach the server.");
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
    load();
    loadResources();
    // Members tick off their work; the bars update without a manual refresh
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        load();
        loadResources();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [load, loadResources]);

  async function handleAssign(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const memberId = String(f.get("memberId"));
    const title = String(f.get("title")).trim();

    setAssignError("");
    setNotice("");
    setBusy(true);
    try {
      const res = await fetch("/api/member/leader/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ memberId, title }),
      });
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/teamdashboard";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't assign this work");

      const who = team?.members.find((m) => m._id === memberId)?.name;
      form.reset();
      setNotice(who ? `Work assigned to ${who}.` : "Work assigned.");
      await load();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Shares a file (raw bytes) or a web link with the leader's own team
  async function handleShare(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const title = String(f.get("title")).trim();

    setShareError("");
    setShareNotice("");
    setSharing(true);
    try {
      let res;
      if (shareMode === "file") {
        const file = f.get("file");
        if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file to upload");
        if (file.size > MAX_BYTES) throw new Error("That file is too large. The limit is 10 MB.");
        res = await fetch("/api/member/leader/resources/file", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-File-Name": encodeURIComponent(file.name),
            "X-File-Title": encodeURIComponent(title),
          },
          credentials: "same-origin",
          body: file,
        });
      } else {
        res = await fetch("/api/member/leader/resources/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ url: String(f.get("url")), title }),
        });
      }

      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/teamdashboard";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't share this");

      form.reset();
      setShareNotice(shareMode === "file" ? "File shared with your team." : "Link shared with your team.");
      await loadResources();
    } catch (err) {
      setShareError(err.message);
    } finally {
      setSharing(false);
    }
  }

  async function removeResource(r) {
    if (!window.confirm(`Remove "${r.title || r.fileName || r.url}" for your team?`)) return;
    setShareError("");
    setShareNotice("");
    try {
      const res = await fetch(`/api/member/leader/resources/${r._id}`, { method: "DELETE", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't remove this");
      await loadResources();
    } catch (err) {
      setShareError(err.message);
    }
  }

  async function logout() {
    await fetch("/api/member/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/");
    router.refresh();
  }

  const date = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const noMembers = team && team.members.length === 0;

  return (
    <div className="min-h-screen">
      <header className="bg-[#0E1B2C]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h1 className="text-xl font-extrabold text-white">Team leader dashboard</h1>
            {team && (
              <p className="text-sm text-[#9FB0C4]">
                {team.leader.area} team · {team.leader.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/teamdashboard"
              className="rounded-lg border border-[#3A4C63] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1B2E45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4FC3A1]"
            >
              My dashboard
            </Link>
            <button
              onClick={logout}
              className="rounded-lg border border-[#3A4C63] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1B2E45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4FC3A1]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        {loadError && <p role="alert" className="text-sm text-[#B42318]">{loadError}</p>}

        {!team ? (
          !loadError && <p className="text-sm text-[#5B6B7B]">Loading your team…</p>
        ) : (
          <>
            {/* Universal progress */}
            <section className="rounded-xl border border-[#D5DCE3] bg-white p-7">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold">Team progress</h2>
                  <p className="mt-1 text-sm text-[#5B6B7B]">
                    {team.overall.total === 0
                      ? "No work assigned yet."
                      : `${team.overall.done} of ${team.overall.total} works done across ${team.members.length} ${team.members.length === 1 ? "member" : "members"}`}
                  </p>
                </div>
                <p className="text-4xl font-extrabold tabular-nums">{team.overall.percent}%</p>
              </div>
              <div className="mt-4">
                <ProgressBar percent={team.overall.percent} label="Overall team progress" large />
              </div>
            </section>

            {/* Assign work */}
            <section className="rounded-xl border border-[#D5DCE3] bg-white p-7">
              <h2 className="text-lg font-extrabold">Assign work</h2>
              <p className="mt-1 text-sm text-[#5B6B7B]">The work appears on the member&apos;s dashboard, where they can tick it off.</p>

              {noMembers ? (
                <p className="mt-4 text-sm leading-relaxed text-[#5B6B7B]">
                  There are no other members in {team.leader.area} yet. Ask the admin to add members to this field.
                </p>
              ) : (
                <form onSubmit={handleAssign} className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] sm:items-end">
                  <div>
                    <label htmlFor="a-member" className="mb-1.5 block text-sm font-medium">Team member</label>
                    <select id="a-member" name="memberId" required defaultValue="" className={field}>
                      <option value="" disabled>Select a member</option>
                      {team.members.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="a-title" className="mb-1.5 block text-sm font-medium">Work to do</label>
                    <input id="a-title" name="title" required minLength={2} maxLength={300} placeholder="e.g. Design the pricing page" className={field} />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-[#1F7A63] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#186350] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14202E]"
                  >
                    {busy ? "Assigning…" : "Assign"}
                  </button>
                </form>
              )}

              {assignError && <p role="alert" className="mt-3 text-sm text-[#B42318]">{assignError}</p>}
              {notice && <p role="status" className="mt-3 text-sm text-[#175C4A]">{notice}</p>}
            </section>

            {/* Share files and links */}
            <section className="rounded-xl border border-[#D5DCE3] bg-white p-7">
              <h2 className="text-lg font-extrabold">Share with your team</h2>
              <p className="mt-1 text-sm text-[#5B6B7B]">
                Only members of {team.leader.area} can see what you share here. Other teams can&apos;t.
              </p>

              <div className="mt-5 inline-grid grid-cols-2 rounded-lg bg-[#EEF1F4] p-1" role="group" aria-label="What to share">
                {[
                  ["file", "File"],
                  ["link", "Web link"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={shareMode === mode}
                    onClick={() => {
                      setShareMode(mode);
                      setShareError("");
                      setShareNotice("");
                    }}
                    className={`rounded-md px-5 py-1.5 text-sm font-semibold transition ${
                      shareMode === mode ? "bg-white text-[#14202E] shadow-sm" : "text-[#5B6B7B]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleShare} className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-title" className="mb-1.5 block text-sm font-medium">Title (optional)</label>
                  <input id="s-title" name="title" maxLength={120} placeholder="e.g. Brand guidelines" className={field} />
                </div>

                {shareMode === "file" ? (
                  <div>
                    <label htmlFor="s-file" className="mb-1.5 block text-sm font-medium">File</label>
                    <input
                      key="file"
                      id="s-file"
                      name="file"
                      type="file"
                      accept={ACCEPT}
                      required
                      className={`${field} file:mr-3 file:rounded-md file:border-0 file:bg-[#EEF1F4] file:px-3 file:py-1 file:text-sm file:font-semibold`}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="s-url" className="mb-1.5 block text-sm font-medium">Web link</label>
                    <input key="link" id="s-url" name="url" required maxLength={2048} placeholder="https://example.com/page" className={field} />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={sharing}
                    className="rounded-lg bg-[#1F7A63] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#186350] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14202E]"
                  >
                    {sharing ? "Sharing…" : "Share"}
                  </button>
                  {shareMode === "file" && (
                    <p className="text-xs text-[#5B6B7B]">Images, PDF, Word, Excel, PowerPoint, text or CSV. Up to 10 MB.</p>
                  )}
                </div>
              </form>

              {shareError && <p role="alert" className="mt-3 text-sm text-[#B42318]">{shareError}</p>}
              {shareNotice && <p role="status" className="mt-3 text-sm text-[#175C4A]">{shareNotice}</p>}

              <div className="mt-6 border-t border-[#E3E8ED] pt-5">
                <h3 className="text-base font-extrabold">Shared so far</h3>
                {resources === null ? (
                  <p className="mt-3 text-sm text-[#5B6B7B]">Loading…</p>
                ) : resources.length === 0 ? (
                  <p className="mt-3 text-sm text-[#5B6B7B]">Nothing shared yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-[#EEF1F4]">
                    {resources.map((r) => (
                      <ResourceItem key={r._id} r={r} date={date} onRemove={removeResource} />
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Per-member progress */}
            {!noMembers && (
              <section>
                <h2 className="text-lg font-extrabold">Members</h2>
                <ul className="mt-4 space-y-4">
                  {team.members.map((m) => (
                    <li key={m._id} className="rounded-xl border border-[#D5DCE3] bg-white p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-base font-extrabold">{m.name}</h3>
                        <p className="text-sm tabular-nums text-[#5B6B7B]">
                          {m.done} of {m.total} done · <span className="font-bold text-[#14202E]">{m.percent}%</span>
                        </p>
                      </div>
                      <div className="mt-3">
                        <ProgressBar percent={m.percent} label={`${m.name}'s progress`} />
                      </div>

                      {m.tasks.length === 0 ? (
                        <p className="mt-3 text-sm text-[#5B6B7B]">No work assigned yet.</p>
                      ) : (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-semibold text-[#1F7A63]">
                            View work ({m.tasks.length})
                          </summary>
                          <ul className="mt-3 divide-y divide-[#EEF1F4]">
                            {m.tasks.map((t) => (
                              <li key={t._id} className="flex items-start justify-between gap-3 py-2.5">
                                <div className="min-w-0">
                                  <p className={`break-words text-sm ${t.done ? "text-[#5B6B7B] line-through" : "font-medium"}`}>{t.title}</p>
                                  <p className="mt-0.5 text-xs text-[#5B6B7B]">
                                    Assigned {date(t.createdAt)}
                                    {t.done && t.doneAt ? ` · Done ${date(t.doneAt)}` : ""}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    t.done ? "bg-[#E8F3EF] text-[#175C4A]" : "bg-[#FFF1DC] text-[#8A4B08]"
                                  }`}
                                >
                                  {t.done ? "Done" : "Pending"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}