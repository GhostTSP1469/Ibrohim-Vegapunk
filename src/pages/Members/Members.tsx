import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Search, SlidersHorizontal, Download, Plus, ChevronDown, Check, Crown, Shield,
  LogOut, Trash2, X, UserPlus,
} from "lucide-react";
import { useWorkspaceStore } from "../Workspace/WorkspaceZustand";
import { useAuthStore } from "../Auth/AuthZustand";

type Role = "owner" | "admin" | "member" | "guest";
const ROLES: Role[] = ["owner", "admin", "member", "guest"];
const FILTER_ROLES: Role[] = ["owner", "admin", "member"];

const roleLabel = (r: string) => r.charAt(0).toUpperCase() + r.slice(1);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

export default function Members() {
  const { workspaceSlug = "" } = useParams();
  const me = useAuthStore((s) => s.user?.id);
  const { members, error, fetchMembers, invite, updateMemberRole, removeMember, leaveWorkspace } = useWorkspaceStore();

  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<Set<Role>>(new Set());
  const [roleMenu, setRoleMenu] = useState<string | null>(null); // user_id whose role dropdown is open
  const [addOpen, setAddOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetchMembers(workspaceSlug);
  }, [fetchMembers, workspaceSlug]);

  const myRole = members.find((m) => m.user_id === me)?.role;
  const isOwner = myRole === "owner";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const matchesQuery =
        !q ||
        m.user.display_name.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q);
      const matchesRole = roleFilter.size === 0 || roleFilter.has(m.role as Role);
      return matchesQuery && matchesRole;
    });
  }, [members, query, roleFilter]);

  const toggleRoleFilter = (r: Role) =>
    setRoleFilter((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });

  const onChangeRole = async (userId: string, role: Role) => {
    setRoleMenu(null);
    await updateMemberRole(workspaceSlug, userId, role);
  };

  const onLeave = async () => {
    if (await leaveWorkspace(workspaceSlug)) setMsg("Leave request sent — waiting for the owner to approve.");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
          Members
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-sm font-semibold text-brand-700">{members.length}</span>
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Filters */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <SlidersHorizontal size={14} /> Filters
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 z-20 mt-1.5 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Roles</p>
                  {FILTER_ROLES.map((r) => (
                    <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      <input type="checkbox" checked={roleFilter.has(r)} onChange={() => toggleRoleFilter(r)} className="accent-brand-600" />
                      {roleLabel(r)}
                    </label>
                  ))}
                  {roleFilter.size > 0 && (
                    <button onClick={() => setRoleFilter(new Set())} className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50">
                      Clear filters
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50">
            <Download size={14} /> Import
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
            <Plus size={15} /> Add member
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-205 text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
              <Th>Full name</Th>
              <Th>Display name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Billing Status</Th>
              <Th>Authentication</Th>
              <Th>Joining date</Th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((m) => {
              const canEditRole = isOwner && m.role !== "owner" && m.user_id !== me;
              return (
                <tr key={m.user_id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <img
                        src={m.user.avatar_url ?? `https://placehold.co/64x64/eef4ff/3f76ff?text=${m.user.display_name.charAt(0).toUpperCase()}`}
                        alt=""
                        className="h-7 w-7 rounded-full border object-cover"
                      />
                      <span className="font-medium text-gray-800">
                        {m.user.display_name}
                        {m.user_id === me && <span className="text-gray-400"> (you)</span>}
                      </span>
                    </span>
                  </td>
                  <td className="max-w-40 truncate px-4 py-3 text-gray-500">{m.user.display_name}</td>
                  <td className="max-w-50 truncate px-4 py-3 text-gray-500">{m.user.email}</td>
                  <td className="px-4 py-3">
                    {canEditRole ? (
                      <div className="relative inline-block">
                        <button
                          onClick={() => setRoleMenu(roleMenu === m.user_id ? null : m.user_id)}
                          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-gray-700 hover:bg-gray-100"
                        >
                          {m.role === "admin" && <Shield size={12} className="text-brand-600" />}
                          {roleLabel(m.role)}
                          <ChevronDown size={13} className="text-gray-400" />
                        </button>
                        {roleMenu === m.user_id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setRoleMenu(null)} />
                            <div className="absolute left-0 z-20 mt-1 w-36 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                              {ROLES.map((r) => (
                                <button
                                  key={r}
                                  onClick={() => onChangeRole(m.user_id, r)}
                                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {roleLabel(r)}
                                  {m.role === r && <Check size={14} className="text-brand-600" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        {m.role === "owner" && <Crown size={12} className="text-amber-500" />}
                        {m.role === "admin" && <Shield size={12} className="text-brand-600" />}
                        {roleLabel(m.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">Email</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(m.created_at)}</td>
                  <td className="px-2 py-3 text-right">
                    {isOwner && m.role !== "owner" && m.user_id !== me && (
                      <button onClick={() => removeMember(workspaceSlug, m.user_id)} className="rounded p-1.5 text-gray-300 hover:bg-gray-100 hover:text-red-600" title="Remove">
                        <Trash2 size={15} />
                      </button>
                    )}
                    {m.user_id === me && !isOwner && (
                      <button onClick={onLeave} className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-600" title="Leave workspace">
                        <LogOut size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No members match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddMemberModal
          onClose={() => setAddOpen(false)}
          onInvite={async (email, role) => {
            const ok = await invite(workspaceSlug, { email, role });
            if (ok) {
              setAddOpen(false);
              setMsg(`Invitation sent to ${email}. They'll join once they accept.`);
              setTimeout(() => setMsg(null), 4000);
            }
            return ok;
          }}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-semibold">
      <span className="inline-flex items-center gap-1">
        {children}
        <ChevronDown size={12} className="text-gray-300" />
      </span>
    </th>
  );
}

function AddMemberModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: "admin" | "member") => Promise<boolean> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onInvite(email.trim(), role);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800"><UserPlus size={18} className="text-brand-600" /> Add member</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
            <input ref={ref} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">An invitation is sent — the person joins the workspace once they accept it from their notifications.</p>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
            <button disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              <Plus size={15} /> {busy ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
