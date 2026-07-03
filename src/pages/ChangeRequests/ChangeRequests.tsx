import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { ClipboardList, Check, X, Send } from "lucide-react";
import { useChangeRequestsStore, type ChangeRequestStatus, type ProjectChanges } from "./ChangeRequestsZustand";
import { useWorkspaceStore } from "../Workspace/WorkspaceZustand";
import { useAuthStore } from "../Auth/AuthZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

const statusBadge: Record<ChangeRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ChangeRequests() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const me = useAuthStore((s) => s.user?.id);
  const { changeRequests, loading, error, fetchChangeRequests, createChangeRequest, approve, reject } =
    useChangeRequestsStore();
  const { members, fetchMembers } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void fetchChangeRequests(workspaceSlug, projectId);
    void fetchMembers(workspaceSlug);
  }, [fetchChangeRequests, fetchMembers, workspaceSlug, projectId]);

  const myRole = members.find((m) => m.user_id === me)?.role;
  const isAdmin = myRole === "admin" || myRole === "owner";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const changes: ProjectChanges = {};
    if (name.trim()) changes.name = name.trim();
    if (description.trim()) changes.description = description.trim();
    if (Object.keys(changes).length === 0) return;
    if (await createChangeRequest(workspaceSlug, projectId, changes)) {
      setName("");
      setDescription("");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Change requests"
        count={changeRequests.length}
        subtitle={isAdmin ? "Review members' requested project changes." : "Request a change to project settings — an admin will review it."}
      />
      <ErrorBanner error={error} />

      <form onSubmit={onSubmit} className={`space-y-2 p-3 ${card}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Request a change</p>
        <div className="flex flex-wrap gap-2">
          <input className={field + " flex-1"} placeholder="New project name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={field + " flex-1"} placeholder="New description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className={primaryBtn} disabled={loading || (!name.trim() && !description.trim())}>
            <Send size={15} /> Submit
          </button>
        </div>
      </form>

      {changeRequests.length === 0 && !loading ? (
        <EmptyState icon={<ClipboardList size={28} />} text="No change requests yet." />
      ) : (
        <div className={`divide-y divide-gray-100 ${card}`}>
          {changeRequests.map((cr) => (
            <div key={cr.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-800">
                  <b>{cr.requester?.display_name ?? "Someone"}</b> · {cr.summary}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {Object.entries(cr.changes).map(([k, v]) => `${k}: ${v ?? "—"}`).join("  ·  ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${statusBadge[cr.status]}`}>{cr.status}</span>
                {isAdmin && cr.status === "pending" && (
                  <>
                    <button onClick={() => approve(workspaceSlug, projectId, cr.id)} className={primaryBtn + " bg-emerald-600 hover:bg-emerald-700"}>
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => reject(workspaceSlug, projectId, cr.id)} className={ghostBtn} title="Reject">
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
