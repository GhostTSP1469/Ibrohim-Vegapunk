import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Users, Crown, Shield, UserPlus, Trash2, LogOut } from "lucide-react";
import { useWorkspaceStore } from "../Workspace/WorkspaceZustand";
import { useAuthStore } from "../Auth/AuthZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

const roleBadge: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-brand-100 text-brand-700",
  member: "bg-gray-100 text-gray-600",
  guest: "bg-gray-100 text-gray-500",
};

export default function Members() {
  const { workspaceSlug = "" } = useParams();
  const me = useAuthStore((s) => s.user?.id);
  const { members, loading, error, fetchMembers, invite, removeMember, leaveWorkspace } = useWorkspaceStore();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetchMembers(workspaceSlug);
  }, [fetchMembers, workspaceSlug]);

  const myRole = members.find((m) => m.user_id === me)?.role;
  const canManage = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const to = email.trim();
    if (await invite(workspaceSlug, { email: to, role })) {
      setEmail("");
      setMsg(`Invitation sent to ${to}. They'll join once they accept.`);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const onLeave = async () => {
    if (await leaveWorkspace(workspaceSlug)) {
      setMsg("Leave request sent — waiting for the owner to approve.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members"
        count={members.length}
        subtitle="People collaborating in this workspace."
        action={
          myRole && !isOwner ? (
            <button onClick={onLeave} className={ghostBtn + " text-red-600 hover:bg-red-50"}>
              <LogOut size={15} /> Leave workspace
            </button>
          ) : undefined
        }
      />
      <ErrorBanner error={error} />
      {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}

      {/* Shown to any member; members without invite rights get the
          "request temporary permission" gate on submit. */}
      {myRole && (
        <form onSubmit={onInvite} className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
          <input className={field + " flex-1"} type="email" placeholder="Invite a user by email…" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <select className={field + " w-32"} value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button className={primaryBtn}><UserPlus size={16} /> Invite</button>
        </form>
      )}

      {members.length === 0 && !loading ? (
        <EmptyState icon={<Users size={28} />} text="No members yet." />
      ) : (
        <div className={`divide-y divide-gray-100 ${card}`}>
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2.5">
                <img
                  src={m.user.avatar_url ?? `https://placehold.co/72x72/eef4ff/3f76ff?text=${m.user.display_name.charAt(0).toUpperCase()}`}
                  alt=""
                  className="h-9 w-9 rounded-full border object-cover"
                />
                <span>
                  <span className="text-sm font-medium text-gray-800">
                    {m.user.display_name}
                    {m.user_id === me && <span className="text-gray-400"> (you)</span>}
                  </span>
                  <span className="block text-xs text-gray-400">{m.user.email}</span>
                </span>
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${roleBadge[m.role] ?? "bg-gray-100 text-gray-600"}`}>
                  {m.role === "owner" && <Crown size={11} />}
                  {m.role === "admin" && <Shield size={11} />}
                  {m.role}
                </span>
              </span>
              {canManage && m.role !== "owner" && m.user_id !== me && (
                <button onClick={() => removeMember(workspaceSlug, m.user_id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600" title="Remove">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
