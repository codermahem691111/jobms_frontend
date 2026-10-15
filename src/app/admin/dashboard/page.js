"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";

/* ---------- API helper (requests are proxied to Express by next.config.mjs) ---------- */
async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    window.location.href = "/admin/login"; // session missing or expired
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

const field =
  "w-full rounded-lg border border-[#C9D1D9] bg-white px-3.5 py-2.5 text-[15px] outline-none transition focus:border-[#1F7A63] focus:ring-2 focus:ring-[#1F7A63]/25 disabled:bg-[#F3F5F7]";

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/* ---------- Areas of work ---------- */
function AreasPanel({ areas, onAdd, onRemove }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get("name")).trim();
    setError("");
    setBusy(true);
    try {
      await onAdd(name);
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(area) {
    if (!window.confirm(`Delete the area "${area.name}"?`)) return;
    setError("");
    try {
      await onRemove(area._id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="rounded-xl border border-[#D5DCE3] bg-white p-6">
      <h2 className="text-lg font-extrabold">Areas of work</h2>
      <p className="mt-1 text-sm text-[#5B6B7B]">The fields your members can specialise in.</p>

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <label htmlFor="area-name" className="sr-only">Area name</label>
        <input id="area-name" name="name" required minLength={2} maxLength={50} placeholder="e.g. UI/UX" className={field} />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-[#14202E] px-4 text-sm font-semibold text-white transition hover:bg-[#1F3147] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A63]"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </form>

      {error && <p role="alert" className="mt-3 text-sm text-[#B42318]">{error}</p>}

      {areas.length === 0 ? (
        <p className="mt-5 text-sm leading-relaxed text-[#5B6B7B]">
          No areas yet. Add your first one, such as UI/UX, Web, Android, iOS, Graphics or Marketing.
        </p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-2">
          {areas.map((a) => (
            <li key={a._id} className="flex items-center gap-1 rounded-full bg-[#E8F3EF] py-1 pl-3.5 pr-1.5 text-sm font-medium text-[#175C4A]">
              {a.name}
              <button
                onClick={() => handleRemove(a)}
                aria-label={`Delete ${a.name}`}
                className="grid h-6 w-6 place-items-center rounded-full text-base leading-none transition hover:bg-[#C9E4DB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F7A63]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Members ---------- */
function MembersPanel({ areas, members, onAdd, onRemove }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const noAreas = areas.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await onAdd({
        name: f.get("name"),
        fatherName: f.get("fatherName"),
        email: f.get("email"),
        area: f.get("area"),
        yearsOfExperience: f.get("yearsOfExperience"),
      });
      form.reset();
      setSuccess("Member added.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(member) {
    if (!window.confirm(`Delete member "${member.name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await onRemove(member._id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="rounded-xl border border-[#D5DCE3] bg-white p-6">
      <h2 className="text-lg font-extrabold">Members</h2>
      <p className="mt-1 text-sm text-[#5B6B7B]">Add the people who will receive work.</p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-name" className="mb-1.5 block text-sm font-medium">Full name</label>
          <input id="m-name" name="name" required minLength={2} maxLength={80} className={field} />
        </div>
        <div>
          <label htmlFor="m-father" className="mb-1.5 block text-sm font-medium">Father&apos;s name</label>
          <input id="m-father" name="fatherName" required minLength={2} maxLength={80} className={field} />
        </div>
        <div>
          <label htmlFor="m-email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input id="m-email" name="email" type="email" required className={field} />
        </div>
        <div>
          <label htmlFor="m-years" className="mb-1.5 block text-sm font-medium">Years of experience</label>
          <input id="m-years" name="yearsOfExperience" type="number" min={0} max={60} step={1} required className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="m-area" className="mb-1.5 block text-sm font-medium">Area of expertise</label>
          <select id="m-area" name="area" required disabled={noAreas} defaultValue="" className={field}>
            <option value="" disabled>
              {noAreas ? "Create an area of work first" : "Select an area"}
            </option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={busy || noAreas}
            className="rounded-lg bg-[#1F7A63] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#186350] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14202E]"
          >
            {busy ? "Saving…" : "Add member"}
          </button>
          {error && <p role="alert" className="text-sm text-[#B42318]">{error}</p>}
          {success && <p role="status" className="text-sm text-[#175C4A]">{success}</p>}
        </div>
      </form>

      <div className="mt-8 border-t border-[#E3E8ED] pt-6">
        {members.length === 0 ? (
          <p className="text-sm text-[#5B6B7B]">No members yet. Members you add will be listed here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-[#5B6B7B]">
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Father&apos;s name</th>
                  <th className="pb-3 pr-4 font-semibold">Email</th>
                  <th className="pb-3 pr-4 font-semibold">Area</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Years</th>
                  <th className="pb-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id} className="border-t border-[#EEF1F4]">
                    <td className="py-3 pr-4 font-semibold">{m.name}</td>
                    <td className="py-3 pr-4">{m.fatherName}</td>
                    <td className="py-3 pr-4">{m.email}</td>
                    <td className="py-3 pr-4">{m.area?.name ?? "—"}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{m.yearsOfExperience}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRemove(m)}
                        className="text-sm font-semibold text-[#B42318] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B42318]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Teams: one card per area, click a card to see its members ---------- */
function TeamsSection({ areas, members, onSetLeader, onRemoveLeader }) {
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const membersByArea = useMemo(() => {
    const map = {};
    areas.forEach((a) => (map[a._id] = []));
    members.forEach((m) => {
      const id = m.area?._id;
      if (id && map[id]) map[id].push(m);
    });
    return map;
  }, [areas, members]);

  const leaderOf = (areaId) => membersByArea[areaId]?.find((m) => m.isTeamLeader);
  const selected = areas.find((a) => a._id === selectedId) || null;
  const team = selected ? membersByArea[selected._id] : [];

  async function run(member, action) {
    setError("");
    setBusyId(member._id);
    try {
      await action(member);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  function makeLeader(member) {
    const current = leaderOf(member.area._id);
    if (
      current &&
      current._id !== member._id &&
      !window.confirm(`${current.name} is the current team leader of ${member.area.name}. Make ${member.name} the team leader instead?`)
    ) {
      return;
    }
    run(member, onSetLeader);
  }

  function removeLeader(member) {
    if (!window.confirm(`Remove ${member.name} as team leader?`)) return;
    run(member, onRemoveLeader);
  }

  return (
    <section className="rounded-xl border border-[#D5DCE3] bg-white p-6">
      <h2 className="text-lg font-extrabold">Teams</h2>
      <p className="mt-1 text-sm text-[#5B6B7B]">Open a field to see its members and choose a team leader. Each field has one team leader.</p>

      {areas.length === 0 ? (
        <p className="mt-5 text-sm text-[#5B6B7B]">Create an area of work below and its team will appear here.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {areas.map((a) => {
            const count = membersByArea[a._id].length;
            const leader = leaderOf(a._id);
            const active = a._id === selectedId;
            return (
              <button
                key={a._id}
                onClick={() => {
                  setSelectedId(active ? "" : a._id);
                  setError("");
                }}
                aria-pressed={active}
                className={`rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A63] ${
                  active ? "border-[#1F7A63] bg-[#E8F3EF]" : "border-[#D5DCE3] bg-[#F8FAFB] hover:border-[#9FB0C4]"
                }`}
              >
                <span className="block text-base font-extrabold">{a.name}</span>
                <span className="mt-1 block text-sm text-[#5B6B7B]">
                  {count} {count === 1 ? "member" : "members"}
                </span>
                <span className={`mt-3 block truncate text-xs font-semibold ${leader ? "text-[#175C4A]" : "text-[#5B6B7B]"}`}>
                  {leader ? `Leader: ${leader.name}` : "No team leader yet"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="mt-6 border-t border-[#E3E8ED] pt-6">
          <h3 className="text-base font-extrabold">{selected.name} members</h3>
          {error && <p role="alert" className="mt-3 text-sm text-[#B42318]">{error}</p>}

          {team.length === 0 ? (
            <p className="mt-3 text-sm text-[#5B6B7B]">No members in this field yet. Add members below and choose {selected.name} as their area.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF1F4]">
              {team.map((m) => (
                <li key={m._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {m.name}
                      {m.isTeamLeader && (
                        <span className="rounded-full bg-[#E8F3EF] px-2.5 py-0.5 text-xs font-bold text-[#175C4A]">Team leader</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-[#5B6B7B]">
                      {m.email} · {m.yearsOfExperience} {m.yearsOfExperience === 1 ? "year" : "years"} experience
                    </p>
                  </div>
                  {m.isTeamLeader ? (
                    <button
                      onClick={() => removeLeader(m)}
                      disabled={busyId === m._id}
                      className="rounded-lg border border-[#C9D1D9] px-3.5 py-2 text-sm font-semibold transition hover:bg-[#F3F5F7] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F7A63]"
                    >
                      Remove team leader
                    </button>
                  ) : (
                    <button
                      onClick={() => makeLeader(m)}
                      disabled={busyId === m._id}
                      className="rounded-lg bg-[#1F7A63] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#186350] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14202E]"
                    >
                      Make team leader
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- Page ---------- */
export default function AdminDashboardPage() {
  const [areas, setAreas] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [a, m] = await Promise.all([api("/areas"), api("/members")]);
      setAreas(a.data);
      setMembers(m.data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addArea(name) {
    const { data } = await api("/areas", { method: "POST", body: { name } });
    setAreas((prev) => [...prev, data].sort(byName));
  }

  async function removeArea(id) {
    await api(`/areas/${id}`, { method: "DELETE" });
    setAreas((prev) => prev.filter((a) => a._id !== id));
  }

  async function addMember(payload) {
    const { data } = await api("/members", { method: "POST", body: payload });
    setMembers((prev) => [data, ...prev]);
  }

  async function removeMember(id) {
    await api(`/members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m._id !== id));
  }

  // One team leader per area: choosing a new one steps the previous leader down
  async function setLeader(member) {
    await api(`/members/${member._id}/team-leader`, { method: "POST" });
    setMembers((prev) =>
      prev.map((m) => (m.area?._id === member.area?._id ? { ...m, isTeamLeader: m._id === member._id } : m))
    );
  }

  async function removeLeader(member) {
    await api(`/members/${member._id}/team-leader`, { method: "DELETE" });
    setMembers((prev) => prev.map((m) => (m._id === member._id ? { ...m, isTeamLeader: false } : m)));
  }

  const stats = [
    { label: "Areas of work", value: areas.length },
    { label: "Members", value: members.length },
    { label: "Team leaders", value: members.filter((m) => m.isTeamLeader).length },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-[#0E1B2C]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-extrabold text-white">Admin dashboard</h1>
            <p className="text-sm text-[#9FB0C4]">Manage areas of work, members and team leaders</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {loading ? (
          <p className="text-sm text-[#5B6B7B]">Loading…</p>
        ) : loadError ? (
          <div role="alert" className="rounded-xl border border-[#F2C4BE] bg-[#FFF4F2] p-5 text-sm text-[#B42318]">
            {loadError}{" "}
            <button onClick={load} className="font-semibold underline underline-offset-4">Try again</button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-3">
              {stats.map((s) => (
                <section key={s.label} className="rounded-xl border border-[#D5DCE3] bg-white p-6">
                  <p className="text-sm font-medium text-[#5B6B7B]">{s.label}</p>
                  <p className="mt-1 text-4xl font-extrabold tabular-nums">{s.value}</p>
                </section>
              ))}
            </div>

            <TeamsSection areas={areas} members={members} onSetLeader={setLeader} onRemoveLeader={removeLeader} />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
              <AreasPanel areas={areas} onAdd={addArea} onRemove={removeArea} />
              <MembersPanel areas={areas} members={members} onAdd={addMember} onRemove={removeMember} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}