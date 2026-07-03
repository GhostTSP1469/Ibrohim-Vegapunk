import { useEffect } from "react";
import { Mail, Check, X, LogOut, Users } from "lucide-react";
import { useInvitesStore, type WorkspaceInvite } from "./InvitesZustand";
import { useAuthStore } from "../Auth/AuthZustand";
import { PageHeader, EmptyState, ErrorBanner, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

export default function Invitations() {
  const me = useAuthStore((s) => s.user?.id);
  const { invites, loading, error, fetchInvites, accept, reject } = useInvitesStore();

  useEffect(() => {
    void fetchInvites();
    const t = setInterval(() => void fetchInvites(), 12000);
    return () => clearInterval(t);
  }, [fetchInvites]);

  const joinInvites = invites.filter((i) => i.kind === "invite" && i.user_id === me);
  const leaveRequests = invites.filter((i) => i.kind === "leave");

  const Row = ({ inv, join }: { inv: WorkspaceInvite; join: boolean }) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${join ? "bg-brand-50 text-brand-600" : "bg-amber-50 text-amber-600"}`}>
          {join ? <Mail size={16} /> : <LogOut size={16} />}
        </span>
        <span className="min-w-0 text-sm text-gray-800">
          {join ? (
            <>
              <b>{inv.actor.display_name}</b> invites you to collaborate in <b>{inv.workspace.name}</b> as <b>{inv.role}</b>
            </>
          ) : (
            <>
              <b>{inv.user.display_name}</b> requested to leave <b>{inv.workspace.name}</b>
            </>
          )}
        </span>
      </span>
      <span className="flex shrink-0 gap-2">
        <button onClick={() => accept(inv.id)} className={primaryBtn + " bg-emerald-600 hover:bg-emerald-700"}>
          <Check size={15} /> {join ? "Accept" : "Approve"}
        </button>
        <button onClick={() => reject(inv.id)} className={ghostBtn} title={join ? "Reject" : "Deny"}>
          <X size={15} />
        </button>
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Invitations" count={invites.length} subtitle="Collaboration invites and leave requests that need your action." />
      <ErrorBanner error={error} />

      {invites.length === 0 && !loading ? (
        <EmptyState icon={<Users size={28} />} text="Nothing to review. Invitations to join workspaces and leave requests you can approve will appear here." />
      ) : (
        <>
          {joinInvites.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Invites for you</p>
              <div className={`divide-y divide-gray-100 ${card}`}>
                {joinInvites.map((inv) => <Row key={inv.id} inv={inv} join />)}
              </div>
            </div>
          )}
          {leaveRequests.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Leave requests to approve</p>
              <div className={`divide-y divide-gray-100 ${card}`}>
                {leaveRequests.map((inv) => <Row key={inv.id} inv={inv} join={false} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
