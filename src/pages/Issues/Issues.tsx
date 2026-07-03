import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {AlertTriangle,SignalHigh,SignalMedium,SignalLow,Minus,Plus,CircleDashed,Circle,CircleDot,CheckCircle2,XCircle,List as ListIcon,Kanban,
  Calendar as CalendarIcon,
  Table2,
  GanttChart,
  SlidersHorizontal,
  BarChart2,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Trash2,
  Pencil,
  Search,
  Flag,
  Boxes,
  Sparkles,
} from "lucide-react";
import { useIssuesStore, type Issue, type Priority } from "./IssuesZustand";
import { useStatesStore, type WorkflowState } from "../States/StatesZustand";

/* ------------------------------------------------------------------ */
/*  Static config                                                      */
/* ------------------------------------------------------------------ */

const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low", "none"];
const VIEWS = [
  { key: "list", label: "List", icon: ListIcon },
  { key: "board", label: "Board", icon: Kanban },
  { key: "calendar", label: "Calendar", icon: CalendarIcon },
  { key: "table", label: "Spreadsheet", icon: Table2 },
  { key: "timeline", label: "Timeline", icon: GanttChart },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PRIORITY_META: Record<
  Priority,
  { icon: ComponentType<{ size?: number; className?: string }>; label: string; text: string; bg: string; border: string }
> = {
  urgent: { icon: AlertTriangle, label: "Urgent", text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  high: { icon: SignalHigh, label: "High", text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  medium: { icon: SignalMedium, label: "Medium", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  low: { icon: SignalLow, label: "Low", text: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  none: { icon: Minus, label: "No priority", text: "text-gray-400", bg: "bg-gray-50", border: "border-gray-200" },
};

function PriorityPill({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority] ?? PRIORITY_META.none;
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${m.text} ${m.bg} ${m.border} transition-colors`}
    >
      <Icon size={12} />
      {m.label}
    </span>
  );
}

/** Derive a visual identity for a workflow state purely from its name, so this
 *  works regardless of whether the backend exposes an explicit "group" field. */
function stateVisual(state: WorkflowState | null) {
  const name = (state?.name ?? "").toLowerCase();
  const dot = state?.color ?? "#9ca3af";
  if (!state) return { icon: CircleDashed, text: "text-gray-400", dot };
  if (name.includes("cancel")) return { icon: XCircle, text: "text-red-500", dot };
  if (name.includes("done") || name.includes("complete")) return { icon: CheckCircle2, text: "text-green-500", dot };
  if (name.includes("progress") || name.includes("started")) return { icon: CircleDot, text: "text-amber-500", dot };
  if (name.includes("backlog")) return { icon: CircleDashed, text: "text-gray-400", dot };
  return { icon: Circle, text: "text-gray-500", dot };
}

function StatePill({ state }: { state: WorkflowState | null }) {
  const { icon: Icon, text } = stateVisual(state);
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm">
      <Icon size={13} className={text} style={state ? { color: state.color } : undefined} />
      {state?.name ?? "No state"}
    </span>
  );
}

function Avatar() {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-300">
      <User size={12} />
    </span>
  );
}

function fmtDate(d?: string | Date) {
  const date = d ? new Date(d) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Add work item modal                                                */
/* ------------------------------------------------------------------ */

type CreateForm = { title: string; description: string; state_id: string; priority: Priority };

function AddIssueModal({
  open,
  onClose,
  states,
  defaultStateId,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  states: WorkflowState[];
  defaultStateId: string;
  onSubmit: (data: CreateForm) => Promise<boolean> | boolean;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    defaultValues: { title: "", description: "", state_id: defaultStateId, priority: "none" },
  });

  useEffect(() => {
    if (open) reset({ title: "", description: "", state_id: defaultStateId, priority: "none" });
  }, [open, defaultStateId, reset]);

  if (!open) return null;

  const submit = handleSubmit(async (data) => {
    const ok = await onSubmit(data);
    if (ok) onClose();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 pt-[10vh] backdrop-blur-sm modal-backdrop">
      <div
        className="modal-panel w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit}>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Sparkles size={15} className="text-brand-500" />
              New work item
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
              <X size={17} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <input
                autoFocus
                placeholder="Issue title"
                className="w-full border-none bg-transparent text-lg font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none"
                {...register("title", { required: true })}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">A title is required.</p>}
            </div>
            <textarea
              rows={3}
              placeholder="Add a description…"
              className="w-full resize-none rounded-md border-none bg-transparent text-sm text-gray-600 placeholder:text-gray-300 focus:outline-none"
              {...register("description")}
            />

            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
              <div className="relative">
                <select
                  className="peer appearance-none rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 outline-none transition focus:border-brand-400 focus:bg-white"
                  {...register("state_id", { required: true })}
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative">
                <select
                  className="appearance-none rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 outline-none transition focus:border-brand-400 focus:bg-white"
                  {...register("priority")}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3">
            <span className="text-xs text-gray-400">Press Enter to submit</span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100">
                Discard
              </button>
              <button
                type="submit"
                disabled={submitting || !states.length}
                className="rounded-md bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? "Adding…" : "Add work item"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Issues() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { issues, loading, error, fetchIssues, createIssue, updateIssue, deleteIssue } = useIssuesStore();
  const { states, fetchStates } = useStatesStore();

  const [view, setView] = useState<ViewKey>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchIssues(workspaceSlug, projectId);
    void fetchStates(workspaceSlug, projectId);
  }, [fetchIssues, fetchStates, workspaceSlug, projectId]);

  const filtered = useMemo(
    () => issues.filter((i) => i.title.toLowerCase().includes(query.trim().toLowerCase())),
    [issues, query],
  );

  const groups = useMemo(() => {
    const byState = new Map<string, Issue[]>();
    for (const issue of filtered) {
      const list = byState.get(issue.state_id) ?? [];
      list.push(issue);
      byState.set(issue.state_id, list);
    }
    // Board view keeps every state column visible, even empty ones.
    const ordered: { state: WorkflowState | null; items: Issue[] }[] = states.map((s) => ({
      state: s,
      items: byState.get(s.id) ?? [],
    }));
    const known = new Set(states.map((s) => s.id));
    const orphans = filtered.filter((i) => !known.has(i.state_id));
    if (orphans.length) ordered.push({ state: null, items: orphans });
    return ordered;
  }, [filtered, states]);

  const listGroups = groups.filter((g) => g.items.length > 0);

  const handleCreate = async (data: CreateForm) => {
    setSubmitting(true);
    try {
      return await createIssue(workspaceSlug, projectId, {
        title: data.title,
        state_id: data.state_id,
        priority: data.priority,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const moveIssue = (issue: Issue, newStateId: string) => {
    if (issue.state_id === newStateId) return;
    void updateIssue(workspaceSlug, projectId, issue.id, { title: issue.title, state_id: newStateId, priority: issue.priority });
  };

  const defaultStateId = states[0]?.id ?? "";

  /* --- calendar helpers --- */
  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: new Date(year, month, i - startOffset + 1), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), inMonth: true });
    while (cells.length % 7 !== 0 || cells.length < 35) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [monthCursor]);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rowIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
        .modal-backdrop { animation: backdropIn .15s ease-out; }
        .modal-panel { animation: modalIn .18s cubic-bezier(.16,1,.3,1); }
        .row-in { animation: rowIn .22s cubic-bezier(.16,1,.3,1) both; }
        .pop-in { animation: popIn .18s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* Breadcrumb / top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Flag size={15} className="text-amber-500" />
          <span className="font-medium text-gray-700">{workspaceSlug || "workspace"}</span>
          <ChevronRight size={13} className="text-gray-300" />
          <Boxes size={15} className="text-brand-500" />
          <span className="font-semibold text-gray-900">Work items</span>
          <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">{filtered.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = view === v.key;
              return (
                <button
                  key={v.key}
                  title={v.label}
                  onClick={() => setView(v.key)}
                  className={`flex h-7 w-8 items-center justify-center rounded-md transition-all ${
                    active ? "bg-gray-100 text-gray-900 shadow-inner" : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>

          <div className="relative hidden items-center sm:flex">
            <Search size={13} className="pointer-events-none absolute left-2.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-36 rounded-lg border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs shadow-sm outline-none transition focus:w-48 focus:border-brand-400"
            />
          </div>

          <button className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 md:flex">
            <SlidersHorizontal size={13} /> Display
          </button>
          <button className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 md:flex">
            <BarChart2 size={13} /> Analytics
          </button>

          <button
            onClick={() => setModalOpen(true)}
            disabled={!states.length}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 hover:shadow-md disabled:opacity-50"
          >
            <Plus size={14} /> Add work item
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:bg-gray-50 hover:text-gray-600">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 pop-in">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {states.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <AlertTriangle size={15} /> Create a workflow state first — a work item requires one.
        </div>
      )}

      {issues.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center pop-in">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <CircleDashed size={24} />
          </span>
          <p className="text-sm font-medium text-gray-500">No work items yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Plus size={14} /> Create your first work item
          </button>
        </div>
      ) : (
        <>
          {/* ---------------- LIST VIEW ---------------- */}
          {view === "list" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {listGroups.map(({ state, items }) => {
                const key = state?.id ?? "none";
                const isCollapsed = collapsed[key];
                const { icon: GIcon } = stateVisual(state);
                return (
                  <div key={key}>
                    <button
                      onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
                      className="flex w-full items-center gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-2 text-left transition hover:bg-gray-100/70"
                    >
                      <ChevronDown size={13} className={`text-gray-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                      <GIcon size={14} style={state ? { color: state.color } : undefined} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">{state?.name ?? "No state"}</span>
                      <span className="rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-500">{items.length}</span>
                    </button>
                    {!isCollapsed &&
                      items.map((i, idx) => (
                        <IssueRow
                          key={i.id}
                          issue={i}
                          index={idx}
                          states={states}
                          onDelete={() => deleteIssue(workspaceSlug, projectId, i.id)}
                          onSave={(data) => updateIssue(workspaceSlug, projectId, i.id, data)}
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                        />
                      ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------------- BOARD VIEW ---------------- */}
          {view === "board" && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {groups.map(({ state, items }) => {
                const { icon: GIcon } = stateVisual(state);
                return (
                  <div
                    key={state?.id ?? "none"}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData("text/issue-id");
                      const issue = issues.find((x) => x.id === id);
                      if (issue && state) moveIssue(issue, state.id);
                    }}
                    className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-50/70 p-2"
                  >
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <GIcon size={14} style={state ? { color: state.color } : undefined} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">{state?.name ?? "No state"}</span>
                      <span className="text-xs font-medium text-gray-400">{items.length}</span>
                      <button
                        onClick={() => {
                          setModalOpen(true);
                        }}
                        className="ml-auto rounded-md p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((i, idx) => (
                        <div
                          key={i.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/issue-id", i.id)}
                          className="row-in group cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400">
                              {workspaceSlug.slice(0, 3).toUpperCase() || "ISS"}-{i.sequence_id}
                            </span>
                            <Link
                              to={`/w/${workspaceSlug}/projects/${projectId}/issues/${i.id}/comments`}
                              className="rounded p-0.5 text-gray-300 opacity-0 transition hover:text-brand-600 group-hover:opacity-100"
                            >
                              <Pencil size={12} />
                            </Link>
                          </div>
                          <Link
                            to={`/w/${workspaceSlug}/projects/${projectId}/issues/${i.id}/comments`}
                            className="line-clamp-2 text-sm font-medium text-gray-800 transition hover:text-brand-600"
                          >
                            {i.title}
                          </Link>
                          <div className="mt-3 flex items-center justify-between">
                            <PriorityPill priority={i.priority} />
                            <Avatar />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------------- CALENDAR VIEW ---------------- */}
          {view === "calendar" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <span className="text-base font-semibold text-gray-800">
                    {monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={() => setMonthCursor(new Date())}
                  className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
                >
                  Today
                </button>
              </div>
              <div className="grid grid-cols-7 border-b border-gray-100 text-xs font-medium text-gray-400">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="px-3 py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarCells.map(({ date, inMonth }, idx) => {
                  const isToday = isSameDay(date, today);
                  return (
                    <div
                      key={idx}
                      className={`group min-h-[92px] border-b border-r border-gray-100 p-2 transition-colors last:border-r-0 ${
                        inMonth ? "bg-white hover:bg-gray-50/70" : "bg-gray-50/40 text-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                          isToday ? "bg-brand-600 font-semibold text-white" : "text-gray-500"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {inMonth && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="mt-2 flex items-center gap-1 text-xs text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-brand-600"
                        >
                          <Plus size={12} /> Add work item
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------- TABLE / SPREADSHEET VIEW ---------------- */}
          {view === "table" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold text-gray-500">
                    <th className="px-4 py-2.5 font-semibold">Work items</th>
                    <th className="px-4 py-2.5 font-semibold">State</th>
                    <th className="px-4 py-2.5 font-semibold">Priority</th>
                    <th className="px-4 py-2.5 font-semibold">Assignees</th>
                    <th className="px-4 py-2.5 font-semibold">Created on</th>
                    <th className="w-10 px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i, idx) => {
                    const s = states.find((st) => st.id === i.state_id) ?? null;
                    const createdAt = (i as unknown as { created_at?: string }).created_at;
                    return (
                      <tr
                        key={i.id}
                        className="row-in group border-b border-gray-50 transition hover:bg-gray-50/60 last:border-b-0"
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400">#{i.sequence_id}</span>
                            <Link
                              to={`/w/${workspaceSlug}/projects/${projectId}/issues/${i.id}/comments`}
                              className="font-medium text-gray-800 hover:text-brand-600"
                            >
                              {i.title}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatePill state={s} />
                        </td>
                        <td className="px-4 py-2.5">
                          <PriorityPill priority={i.priority} />
                        </td>
                        <td className="px-4 py-2.5">
                          <Avatar />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDate(createdAt)}</td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            onClick={() => deleteIssue(workspaceSlug, projectId, i.id)}
                            className="rounded p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ---------------- TIMELINE / GANTT VIEW ---------------- */}
          {view === "timeline" && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex min-w-[720px]">
                <div className="w-56 shrink-0 border-r border-gray-100">
                  <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-500">Work items</div>
                  {filtered.map((i) => (
                    <div key={i.id} className="flex items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-b-0">
                      <span className="text-xs font-semibold text-gray-400">#{i.sequence_id}</span>
                      <Link
                        to={`/w/${workspaceSlug}/projects/${projectId}/issues/${i.id}/comments`}
                        className="truncate text-sm text-gray-700 hover:text-brand-600"
                      >
                        {i.title}
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="relative flex-1">
                  <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] border-b border-gray-100 text-center text-[11px] text-gray-400">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - 3 + i);
                      const isToday = isSameDay(d, today);
                      return (
                        <div key={i} className={`border-r border-gray-50 py-2.5 last:border-r-0 ${isToday ? "bg-brand-50/60 font-semibold text-brand-600" : ""}`}>
                          {d.getDate()}
                        </div>
                      );
                    })}
                  </div>
                  {filtered.map((i, rowIdx) => {
                    const s = states.find((st) => st.id === i.state_id) ?? null;
                    const { text } = stateVisual(s);
                    const start = 3 + (rowIdx % 5);
                    const span = 2 + (i.sequence_id % 4);
                    return (
                      <div key={i.id} className="relative h-[45px] border-b border-gray-50 last:border-b-0">
                        <div
                          className={`row-in absolute top-1/2 h-5 -translate-y-1/2 rounded-full ${text} bg-current/15 shadow-sm`}
                          style={{
                            left: `${(start / 14) * 100}%`,
                            width: `${(span / 14) * 100}%`,
                            animationDelay: `${rowIdx * 30}ms`,
                          }}
                        >
                          <div className="h-full w-full rounded-full opacity-30" style={{ background: s?.color ?? "#9ca3af" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <AddIssueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        states={states}
        defaultStateId={defaultStateId}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  List row (with inline edit)                                        */
/* ------------------------------------------------------------------ */

function IssueRow({
  issue,
  index,
  states,
  onDelete,
  onSave,
  workspaceSlug,
  projectId,
}: {
  issue: Issue;
  index: number;
  states: WorkflowState[];
  onDelete: () => void;
  onSave: (data: { title: string; state_id: string; priority: Priority }) => Promise<boolean> | boolean;
  workspaceSlug: string;
  projectId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [stateId, setStateId] = useState(issue.state_id);
  const [priority, setPriority] = useState<Priority>(issue.priority);

  if (editing) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await onSave({ title, state_id: stateId, priority })) setEditing(false);
        }}
        className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-brand-50/30 px-4 py-2.5 last:border-b-0"
      >
        <input
          autoFocus
          className="min-w-40 flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand-400"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <select value={stateId} onChange={(e) => setStateId(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1 text-xs">
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="rounded-md border border-gray-200 px-2 py-1 text-xs">
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-brand-700">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100">
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div
      className="row-in group flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 transition last:border-b-0 hover:bg-gray-50/70"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <span className="w-14 shrink-0 text-xs font-semibold text-gray-400">
        {workspaceSlug.slice(0, 3).toUpperCase() || "ISS"}-{issue.sequence_id}
      </span>
      <Link to={`/w/${workspaceSlug}/projects/${projectId}/issues/${issue.id}/comments`} className="flex-1 truncate text-sm text-gray-800 transition hover:text-brand-600">
        {issue.title}
      </Link>
      <PriorityPill priority={issue.priority} />
      <Avatar />
      <span className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
        <button onClick={() => setEditing(true)} className="rounded-md p-1.5 text-gray-400 transition hover:bg-brand-50 hover:text-brand-600">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </span>
    </div>
  );
}
