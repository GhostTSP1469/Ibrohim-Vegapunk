import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  X, CircleDashed, Circle, CircleDot, CheckCircle2, XCircle,
  SignalHigh, SignalMedium, SignalLow, Minus, AlertOctagon,
  Bold, Italic, Underline, List, Code, Send,
} from "lucide-react";
import { useIssueDrawer } from "../../pages/Issues/IssueDrawerZustand";
import { useCommentsStore } from "../../pages/Comments/CommentsZustand";
import { useStatesStore, type StateGroup } from "../../pages/States/StatesZustand";
import { useAuthStore } from "../../pages/Auth/AuthZustand";
import { useToastStore } from "./toast";
import type { Issue, Priority } from "../../pages/Issues/IssuesZustand";

const stateGroupIcon: Record<StateGroup, { icon: typeof Circle; cls: string }> = {
  backlog: { icon: CircleDashed, cls: "text-gray-400" },
  unstarted: { icon: Circle, cls: "text-gray-400" },
  started: { icon: CircleDot, cls: "text-amber-500" },
  completed: { icon: CheckCircle2, cls: "text-emerald-500" },
  cancelled: { icon: XCircle, cls: "text-red-500" },
};
const priorityMeta: Record<Priority, { icon: typeof Minus; cls: string; label: string }> = {
  urgent: { icon: AlertOctagon, cls: "text-red-600", label: "Urgent" },
  high: { icon: SignalHigh, cls: "text-orange-500", label: "High" },
  medium: { icon: SignalMedium, cls: "text-amber-500", label: "Medium" },
  low: { icon: SignalLow, cls: "text-blue-500", label: "Low" },
  none: { icon: Minus, cls: "text-gray-400", label: "None" },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" });

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "less than a minute ago";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

export default function IssueDrawer() {
  const { slug, projectId, issue, close } = useIssueDrawer();
  if (!issue) return null;
  // Keyed by issue id so opening a different work item remounts with fresh state.
  return <DrawerPanel key={issue.id} slug={slug} projectId={projectId} issue={issue} onClose={close} />;
}

function DrawerPanel({ slug, projectId, issue, onClose }: { slug: string; projectId: string; issue: Issue; onClose: () => void }) {
  const { comments, fetchComments, createComment } = useCommentsStore();
  const { states, fetchStates } = useStatesStore();
  const meName = useAuthStore((s) => s.user?.display_name);
  const meAvatar = useAuthStore((s) => s.user?.avatar_url);
  const push = useToastStore((s) => s.push);

  const [tab, setTab] = useState<"all" | "comments">("all");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchComments(slug, projectId, issue.id);
  }, [fetchComments, slug, projectId, issue.id]);

  useEffect(() => {
    if (states.length === 0) void fetchStates(slug, projectId);
  }, [fetchStates, states.length, slug, projectId]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const state = useMemo(() => states.find((s) => s.id === issue.state_id), [states, issue.state_id]);

  const prefix = slug.slice(0, 5).toUpperCase() || "ISS";
  const grp = state?.group ?? "backlog";
  const SIcon = stateGroupIcon[grp].icon;
  const pm = priorityMeta[issue.priority];
  const PIcon = pm.icon;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    const ok = await createComment(slug, projectId, issue.id, { body: text });
    setBusy(false);
    if (ok) {
      setBody("");
      push("Comment created successfully");
    }
  };

  return (
    <div className="fixed inset-0 z-90 flex justify-end bg-black/25" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-140 flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "drawerIn .28s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <style>{`@keyframes drawerIn { from { transform: translateX(24px); opacity:.6 } to { transform: translateX(0); opacity:1 } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <span className="text-xs font-semibold text-gray-400">{prefix}-{issue.sequence_id}</span>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Title + details */}
          <div className="space-y-4 px-5 py-4">
            <h1 className="text-lg font-semibold text-gray-900">{issue.title}</h1>

            <div className="space-y-2.5 text-sm">
              <Detail label="State">
                <span className="flex items-center gap-1.5 text-gray-700"><SIcon size={14} className={stateGroupIcon[grp].cls} /> {state?.name ?? "—"}</span>
              </Detail>
              <Detail label="Priority">
                <span className={`flex items-center gap-1.5 ${pm.cls}`}><PIcon size={14} /> <span className="text-gray-700">{pm.label}</span></span>
              </Detail>
              {issue.due_date && <Detail label="Due date"><span className="text-gray-700">{fmt(issue.due_date)}</span></Detail>}
              <Detail label="Created on"><span className="text-gray-500">{fmt(issue.created_at)}</span></Detail>
              <Detail label="Updated on"><span className="text-gray-500">{fmt(issue.updated_at)}</span></Detail>
            </div>

            {issue.description && (
              <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{issue.description}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="sticky top-0 flex gap-5 border-y border-gray-100 bg-white px-5">
            {(["all", "comments"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 py-2.5 text-sm font-medium capitalize transition ${
                  tab === t ? "border-brand-500 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "all" ? "All" : "Comments"}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="space-y-4 px-5 py-4">
            {tab === "all" && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">◈</span>
                <span><b className="text-gray-700">Work item</b> created · {timeAgo(issue.created_at)}</span>
              </div>
            )}

            {comments.length === 0 ? (
              <p className="py-2 text-sm text-gray-400">No comments yet. Start the conversation below.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img
                    src={c.author?.avatar_url ?? `https://placehold.co/48x48/eef4ff/3f76ff?text=${(c.author?.display_name ?? "?").charAt(0).toUpperCase()}`}
                    alt=""
                    className="h-7 w-7 rounded-full border object-cover"
                  />
                  <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
                    <p className="text-sm">
                      <b className="text-gray-800">{c.author?.display_name ?? "Someone"}</b>
                      <span className="text-gray-400"> commented · {timeAgo(c.created_at)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{c.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comment editor */}
        <form onSubmit={onSubmit} className="border-t border-gray-100 p-4">
          <div className="rounded-xl border border-gray-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <div className="flex items-center gap-2.5 px-3 pt-2">
              <img
                src={meAvatar ?? `https://placehold.co/48x48/eef4ff/3f76ff?text=${(meName ?? "?").charAt(0).toUpperCase()}`}
                alt=""
                className="h-6 w-6 rounded-full border object-cover"
              />
              <span className="text-xs text-gray-400">Add comment</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="Write a comment…"
              className="w-full resize-none bg-transparent px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1.5">
              <div className="flex items-center gap-0.5 text-gray-400">
                {[Bold, Italic, Underline, List, Code].map((Icon, idx) => (
                  <span key={idx} className="rounded p-1.5 hover:bg-gray-100"><Icon size={14} /></span>
                ))}
              </div>
              <button
                disabled={busy || !body.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                <Send size={13} /> {busy ? "…" : "Comment"}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-gray-400">{label}</span>
      {children}
    </div>
  );
}
