import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, RefreshCw, ChevronDown, TrendingDown, X, Info } from "lucide-react";
import { useCyclesStore, type Cycle } from "./CyclesZustand";
import { useIssuesStore } from "../Issues/IssuesZustand";
import { useStatesStore, type StateGroup } from "../States/StatesZustand";
import { toIsoDate } from "../../api";

const DAY = 86_400_000;
const dayDiff = (a: number, b: number) => Math.round((a - b) / DAY);
const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function Cycles() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { cycles, error, fetchCycles, createCycle, deleteCycle } = useCyclesStore();
  const { issues, fetchIssues } = useIssuesStore();
  const { states, fetchStates } = useStatesStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void fetchCycles(workspaceSlug, projectId);
    void fetchIssues(workspaceSlug, projectId);
    void fetchStates(workspaceSlug, projectId);
  }, [fetchCycles, fetchIssues, fetchStates, workspaceSlug, projectId]);

  const groupById = useMemo(() => {
    const m = new Map<string, StateGroup>();
    states.forEach((s) => m.set(s.id, s.group));
    return m;
  }, [states]);

  // Fall back to the first cycle until the user explicitly picks one.
  const selected = cycles.find((c) => c.id === selectedId) ?? cycles[0] ?? null;

  const stats = useMemo(() => {
    if (!selected) return null;
    const inCycle = issues.filter((i) => i.cycle_id === selected.id);
    const counts: Record<StateGroup, number> = { backlog: 0, unstarted: 0, started: 0, completed: 0, cancelled: 0 };
    inCycle.forEach((i) => {
      const g = groupById.get(i.state_id) ?? "backlog";
      counts[g]++;
    });
    const scope = inCycle.length;
    const pending = counts.backlog + counts.unstarted + counts.started;
    return { scope, pending, counts };
  }, [selected, issues, groupById]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="text-gray-500" />
          <h1 className="text-lg font-semibold text-gray-800">Cycles</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{cycles.length}</span>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <Plus size={15} /> New cycle
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><RefreshCw size={24} /></div>
          <p className="font-medium text-gray-700">No cycles yet</p>
          <p className="max-w-xs text-sm text-gray-400">Group work into time-boxed sprints and track progress with a burn-down chart.</p>
          <button onClick={() => setCreateOpen(true)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"><Plus size={15} /> Create a cycle</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          {/* Cycle list */}
          <div className="space-y-1 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            {cycles.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  selected?.id === c.id ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <RefreshCw size={14} className={selected?.id === c.id ? "text-brand-600" : "text-gray-400"} />
                <span className="flex-1 truncate font-medium">{c.name}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); void deleteCycle(workspaceSlug, projectId, c.id); }}
                  className="rounded p-1 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-red-600 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </span>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected && stats ? <CycleDetail cycle={selected} stats={stats} /> : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">Select a cycle to see its progress.</div>
          )}
        </div>
      )}

      {createOpen && (
        <CreateCycleModal
          onClose={() => setCreateOpen(false)}
          onCreate={async (data) => {
            const ok = await createCycle(workspaceSlug, projectId, data);
            if (ok) setCreateOpen(false);
            return ok;
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cycle detail + burn-down                                           */
/* ------------------------------------------------------------------ */

function CycleDetail({ cycle, stats }: { cycle: Cycle; stats: { scope: number; pending: number; counts: Record<StateGroup, number> } }) {
  const now = Date.now();
  const start = cycle.start_date ? new Date(cycle.start_date) : new Date(cycle.created_at);
  const end = cycle.end_date ? new Date(cycle.end_date) : new Date(start.getTime() + 14 * DAY);
  const totalDays = Math.max(1, dayDiff(end.getTime(), start.getTime()));
  const daysLeft = Math.max(0, dayDiff(end.getTime(), now));
  const elapsed = Math.min(totalDays, Math.max(0, dayDiff(now, start.getTime())));

  const { scope, pending, counts } = stats;
  const idealRemaining = scope * (1 - elapsed / totalDays);
  const trailing = Math.max(0, Math.round(pending - idealRemaining));

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
        <span className="flex items-center gap-2">
          <RefreshCw size={16} className="text-brand-600" />
          <span className="font-semibold text-gray-800">{cycle.name}</span>
          <span className="text-sm text-gray-400">· {daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>
        </span>
        <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50">View cycle</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Breakdown */}
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Breakdown of this cycle's work items</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-gray-800">
              <TrendingDown size={16} className="text-rose-500" /> Trailing by {trailing} work item{trailing === 1 ? "" : "s"}
            </p>
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">Work Items by stategroups on chart</p>
            <Legend color="bg-sky-400" label="Today's ideal Pending" value={Math.round(idealRemaining)} muted />
            <Legend color="bg-emerald-500" label="Pending" value={pending} />
            <Legend color="bg-amber-500" label="Started" value={counts.started} />
            <Legend color="bg-blue-500" label="Scope" value={scope} />
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">Other stategroups</p>
            <Row label="Done" value={counts.completed} />
            <Row label="Unstarted" value={counts.unstarted} />
            <Row label="Backlog" value={counts.backlog} />
          </div>

          <p className="flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-400">
            <Info size={12} /> Excluded {counts.cancelled} cancelled work item{counts.cancelled === 1 ? "" : "s"}
          </p>
        </div>

        {/* Chart */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-gray-600">
              Burn-down <ChevronDown size={13} className="text-gray-400" />
            </span>
            <span className="text-gray-400">for</span>
            <span className="font-medium text-gray-700">Work Items</span>
          </div>
          <Burndown scope={scope} pending={pending} start={start} end={end} totalDays={totalDays} elapsed={elapsed} />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, value, muted }: { color: string; label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1 w-4 rounded-full ${color} ${muted ? "opacity-60" : ""}`} />
      <span className={`flex-1 ${muted ? "text-gray-400" : "text-gray-600"}`}>{label}</span>
      <span className={`rounded px-1.5 text-xs font-semibold ${muted ? "text-gray-400" : "bg-gray-100 text-gray-700"}`}>{value}</span>
    </div>
  );
}
function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-500">{value}</span>
    </div>
  );
}

function Burndown({ scope, pending, start, end, totalDays, elapsed }: {
  scope: number; pending: number; start: Date; end: Date; totalDays: number; elapsed: number;
}) {
  const W = 760, H = 300, padL = 34, padB = 28, padT = 12, padR = 12;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxY = Math.max(scope, 1);

  const x = (d: number) => padL + (d / totalDays) * plotW; // d = days from start
  const y = (v: number) => padT + (1 - v / maxY) * plotH;

  const todayX = x(Math.min(totalDays, elapsed));
  const ticks = 4;
  const dateTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const d = Math.round((totalDays / ticks) * i);
    return { d, date: new Date(start.getTime() + d * DAY) };
  });
  const yTicks = Array.from({ length: maxY + 1 }, (_, i) => i);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* grid + y labels */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#f1f5f9" />
            <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
          </g>
        ))}
        {/* x labels */}
        {dateTicks.map((t, i) => (
          <text key={i} x={x(t.d)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{fmtShort(t.date)}</text>
        ))}
        {/* today marker */}
        <line x1={todayX} y1={padT} x2={todayX} y2={padT + plotH} stroke="#cbd5e1" strokeDasharray="4 4" />

        {/* ideal line: scope -> 0 (dashed blue) */}
        <line x1={x(0)} y1={y(scope)} x2={x(totalDays)} y2={y(0)} stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 5" opacity="0.7" />

        {/* actual line: flat at `pending` from start to today (green) */}
        <line x1={x(0)} y1={y(pending)} x2={todayX} y2={y(pending)} stroke="#10b981" strokeWidth="2.5" />
        <circle cx={todayX} cy={y(pending)} r="3.5" fill="#10b981" />

        {/* shaded gap between ideal and actual up to today */}
        <polygon
          points={`${x(0)},${y(scope)} ${todayX},${y(scope - (scope) * (elapsed / totalDays))} ${todayX},${y(pending)} ${x(0)},${y(pending)}`}
          fill="#10b981" opacity="0.06"
        />
      </svg>
      <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-emerald-500" /> Pending {pending}</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-blue-500" /> Ideal</span>
        <span className="ml-auto text-gray-400">Started {fmtShort(start)} · Ends {fmtShort(end)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create modal                                                       */
/* ------------------------------------------------------------------ */

function CreateCycleModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: { name: string; start_date?: string; end_date?: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onCreate({ name: name.trim(), start_date: toIsoDate(start), end_date: toIsoDate(end) });
    setBusy(false);
  };

  const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800"><RefreshCw size={18} className="text-brand-600" /> New cycle</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Cycle name</label>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cycle 1: Getting started" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Start date</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">End date</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
            <button disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"><Plus size={15} /> {busy ? "Creating…" : "Create cycle"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
