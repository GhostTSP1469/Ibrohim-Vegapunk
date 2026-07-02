import { useEffect, useMemo, useState, type FormEvent, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, SignalHigh, SignalMedium, SignalLow, Minus, Plus } from "lucide-react";
import { useIssuesStore, type Issue, type Priority } from "./IssuesZustand";
import { useStatesStore, type WorkflowState } from "../States/StatesZustand";

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high", "urgent"];

const PRIORITY_ICON: Record<Priority, { icon: ComponentType<{ size?: number; className?: string }>; className: string }> = {
  urgent: { icon: AlertTriangle, className: "text-red-500" },
  high: { icon: SignalHigh, className: "text-orange-500" },
  medium: { icon: SignalMedium, className: "text-amber-500" },
  low: { icon: SignalLow, className: "text-gray-400" },
  none: { icon: Minus, className: "text-gray-300" },
};

function PriorityMark({ priority }: { priority: Priority }) {
  const { icon: Icon, className } = PRIORITY_ICON[priority] ?? PRIORITY_ICON.none;
  return <Icon size={16} className={className} />;
}

export default function Issues() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { issues, loading, error, fetchIssues, createIssue, updateIssue, deleteIssue } = useIssuesStore();
  const { states, fetchStates } = useStatesStore();

  const [title, setTitle] = useState("");
  const [stateId, setStateId] = useState("");
  const [priority, setPriority] = useState<Priority>("none");

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editState, setEditState] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("none");

  useEffect(() => {
    void fetchIssues(workspaceSlug, projectId);
    void fetchStates(workspaceSlug, projectId);
  }, [fetchIssues, fetchStates, workspaceSlug, projectId]);

  useEffect(() => {
    if (!stateId && states[0]) setStateId(states[0].id);
  }, [states, stateId]);

  const groups = useMemo(() => {
    const byState = new Map<string, Issue[]>();
    for (const issue of issues) {
      const list = byState.get(issue.state_id) ?? [];
      list.push(issue);
      byState.set(issue.state_id, list);
    }
    const ordered: { state: WorkflowState | null; items: Issue[] }[] = states
      .map((s) => ({ state: s, items: byState.get(s.id) ?? [] }))
      .filter((g) => g.items.length > 0);
    const known = new Set(states.map((s) => s.id));
    const orphans = issues.filter((i) => !known.has(i.state_id));
    if (orphans.length) ordered.push({ state: null, items: orphans });
    return ordered;
  }, [issues, states]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createIssue(workspaceSlug, projectId, { title, state_id: stateId, priority })) setTitle("");
  };

  const startEdit = (i: Issue) => {
    setEditId(i.id);
    setEditTitle(i.title);
    setEditState(i.state_id);
    setEditPriority(i.priority);
  };

  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateIssue(workspaceSlug, projectId, id, { title: editTitle, state_id: editState, priority: editPriority })) {
      setEditId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Issues</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input className={input + " min-w-52 flex-1"} placeholder="New issue title…" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <select value={stateId} onChange={(e) => setStateId(e.target.value)} className={input} required>
          <option value="" disabled>State…</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={input}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button className={btn} disabled={loading || !stateId}>
          <Plus size={16} /> Add
        </button>
      </form>
      {states.length === 0 && (
        <p className="text-sm text-gray-400">Create a state first — an issue requires one.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {groups.map(({ state, items }) => (
          <div key={state?.id ?? "none"}>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: state?.color ?? "#d1d5db" }} />
              <span className="text-sm font-medium text-gray-700">{state?.name ?? "No state"}</span>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            {items.map((i) =>
              editId === i.id ? (
                <form key={i.id} onSubmit={(e) => onSaveEdit(e, i.id)} className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-2.5">
                  <input className={input + " min-w-40 flex-1"} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                  <select value={editState} onChange={(e) => setEditState(e.target.value)} className={input}>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)} className={input}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button className={btn} disabled={loading}>Save</button>
                  <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                </form>
              ) : (
                <div key={i.id} className="group flex items-center gap-3 border-t border-gray-100 px-4 py-2.5 hover:bg-gray-50">
                  <PriorityMark priority={i.priority} />
                  <span className="w-12 shrink-0 text-xs font-medium text-gray-400">#{i.sequence_id}</span>
                  <Link
                    to={`/w/${workspaceSlug}/projects/${projectId}/issues/${i.id}/comments`}
                    className="flex-1 truncate text-sm text-gray-800 hover:text-brand-600"
                  >
                    {i.title}
                  </Link>
                  <span className="flex shrink-0 gap-3 opacity-0 group-hover:opacity-100">
                    <button onClick={() => startEdit(i)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => deleteIssue(workspaceSlug, projectId, i.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                  </span>
                </div>
              ),
            )}
          </div>
        ))}
        {!loading && issues.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400">No issues yet.</div>
        )}
      </div>
    </div>
  );
}
