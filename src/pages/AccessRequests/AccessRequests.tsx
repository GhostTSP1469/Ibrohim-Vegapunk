import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, Check, X, Send, Clock, KeyRound } from "lucide-react";
import { useAccessStore, type AccessRequest, type AccessStatus } from "./AccessZustand";
import { useWorkspaceStore } from "../Workspace/WorkspaceZustand";
import { useAuthStore } from "../Auth/AuthZustand";
import { CAPABILITIES, CAPABILITY_LABEL, isReviewerRole, type Capability, type WorkspaceRole } from "../../lib/permissions";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

const statusBadge: Record<AccessStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AccessRequests() {
  const { workspaceSlug = "" } = useParams();
  const me = useAuthStore((s) => s.user?.id);
  const { requests, grants, loading, error, fetchRequests, fetchGrants, createRequest, approve, reject } =
    useAccessStore();
  const { members, fetchMembers } = useWorkspaceStore();

  const [capability, setCapability] = useState<Capability>(CAPABILITIES[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    void fetchMembers(workspaceSlug);
    const poll = () => {
      void fetchRequests(workspaceSlug);
      void fetchGrants(workspaceSlug);
    };
    poll();
    // Keep the queue/status live so an approval or new request shows without a refresh.
    const t = setInterval(poll, 10000);
    return () => clearInterval(t);
  }, [fetchRequests, fetchGrants, fetchMembers, workspaceSlug]);

  const myRole = members.find((m) => m.user_id === me)?.role as WorkspaceRole | undefined;
  const isReviewer = isReviewerRole(myRole);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (await createRequest(workspaceSlug, { capability, note: note.trim() || undefined })) {
      setNote("");
    }
  };

  const activeGrants = grants.filter((g) => new Date(g.expires_at) > new Date());
  const pending = requests.filter((r) => r.status === "pending");

  const Row = ({ r }: { r: AccessRequest }) => (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-gray-800">
          <b>{r.requester.display_name}</b> requests <b>{CAPABILITY_LABEL[r.capability] ?? r.capability}</b>
          {r.target_label && <span className="text-gray-400"> · {r.target_label}</span>}
        </p>
        {r.note && <p className="mt-0.5 truncate text-xs text-gray-500">“{r.note}”</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${statusBadge[r.status]}`}>{r.status}</span>
        {isReviewer && r.status === "pending" && (
          <>
            <button onClick={() => approve(workspaceSlug, r.id)} className={primaryBtn + " bg-emerald-600 hover:bg-emerald-700"}>
              <Check size={14} /> Approve
            </button>
            <button onClick={() => reject(workspaceSlug, r.id)} className={ghostBtn} title="Reject">
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Requests"
        count={requests.length}
        subtitle={
          isReviewer
            ? "Approve or reject members' requests for temporary permissions."
            : "Ask an admin for temporary permission to do something your role can't."
        }
      />
      <ErrorBanner error={error} />

      {/* Members: raise a request + see their active grants */}
      {!isReviewer && myRole && (
        <>
          <form onSubmit={onSubmit} className={`space-y-2 p-3 ${card}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Request temporary permission</p>
            <div className="flex flex-wrap gap-2">
              <select className={field + " flex-1"} value={capability} onChange={(e) => setCapability(e.target.value as Capability)}>
                {CAPABILITIES.map((c) => (
                  <option key={c} value={c}>{CAPABILITY_LABEL[c]}</option>
                ))}
              </select>
              <input className={field + " flex-1"} placeholder="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className={primaryBtn} disabled={loading}><Send size={15} /> Send request</button>
            </div>
          </form>

          {activeGrants.length > 0 && (
            <div className={`p-3 ${card}`}>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <KeyRound size={13} /> Active temporary access
              </p>
              <div className="flex flex-wrap gap-2">
                {activeGrants.map((g) => (
                  <span key={g.capability} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Clock size={12} />
                    {CAPABILITY_LABEL[g.capability as Capability] ?? g.capability}
                    <span className="text-emerald-500">· until {new Date(g.expires_at).toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reviewers: pending queue highlighted first */}
      {isReviewer && pending.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Awaiting your review</p>
          <div className={`divide-y divide-gray-100 ${card}`}>
            {pending.map((r) => <Row key={r.id} r={r} />)}
          </div>
        </div>
      )}

      <div>
        {isReviewer && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">All requests</p>}
        {requests.length === 0 && !loading ? (
          <EmptyState icon={<ShieldCheck size={28} />} text={isReviewer ? "No requests yet." : "You haven't requested any permissions yet."} />
        ) : (
          <div className={`divide-y divide-gray-100 ${card}`}>
            {requests.map((r) => <Row key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
