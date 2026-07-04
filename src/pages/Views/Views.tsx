import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Table2, CircleDashed, Circle, CircleDot, CheckCircle2, XCircle,
  SignalHigh, SignalMedium, SignalLow, Minus, AlertOctagon,
  Users, Tag, Boxes, ChevronDown,
} from "lucide-react";
import { useIssuesStore, type Issue, type Priority } from "../Issues/IssuesZustand";
import { useStatesStore, type WorkflowState, type StateGroup } from "../States/StatesZustand";
import { useIssueDrawer } from "../Issues/IssueDrawerZustand";

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

function Col({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <th className="border-l border-gray-100 px-3 py-2.5 text-left font-semibold text-gray-500">
      <span className="flex items-center gap-1.5">
        <Icon size={14} className="text-gray-400" /> {label}
        <ChevronDown size={12} className="ml-auto text-gray-300" />
      </span>
    </th>
  );
}

export default function Views() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { issues, fetchIssues } = useIssuesStore();
  const { states, fetchStates } = useStatesStore();
  const open = useIssueDrawer((s) => s.open);

  useEffect(() => {
    void fetchIssues(workspaceSlug, projectId);
    void fetchStates(workspaceSlug, projectId);
  }, [fetchIssues, fetchStates, workspaceSlug, projectId]);

  const stateById = useMemo(() => {
    const m = new Map<string, WorkflowState>();
    states.forEach((s) => m.set(s.id, s));
    return m;
  }, [states]);

  const prefix = (workspaceSlug.slice(0, 5).toUpperCase() || "ISS");
  const ordered = useMemo(() => [...issues].sort((a, b) => b.sequence_id - a.sequence_id), [issues]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Table2 size={18} className="text-gray-500" />
        <h1 className="text-lg font-semibold text-gray-800">Spreadsheet</h1>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{issues.length}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-238 border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-xs">
              <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Work items</th>
              <Col icon={Circle} label="State" />
              <Col icon={SignalHigh} label="Priority" />
              <Col icon={Users} label="Assignees" />
              <Col icon={Tag} label="Labels" />
              <Col icon={Boxes} label="Modules" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ordered.map((i: Issue) => {
              const st = stateById.get(i.state_id);
              const grp = st?.group ?? "backlog";
              const SIcon = stateGroupIcon[grp].icon;
              const pm = priorityMeta[i.priority];
              const PIcon = pm.icon;
              const labelCount = Array.isArray(i.labels) ? i.labels.length : 0;
              return (
                <tr
                  key={i.id}
                  onClick={() => open(workspaceSlug, projectId, i)}
                  className="cursor-pointer hover:bg-gray-50/70"
                >
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">{prefix}-{i.sequence_id}</span>
                      <span className="truncate font-medium text-gray-800">{i.title}</span>
                    </span>
                  </td>
                  <td className="border-l border-gray-100 px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <SIcon size={14} className={stateGroupIcon[grp].cls} />
                      {st?.name ?? "—"}
                    </span>
                  </td>
                  <td className="border-l border-gray-100 px-3 py-2.5">
                    <span className={`flex items-center gap-1.5 ${pm.cls}`}>
                      <PIcon size={14} /> <span className="text-gray-700">{pm.label}</span>
                    </span>
                  </td>
                  <td className="border-l border-gray-100 px-3 py-2.5 text-gray-400">
                    <span className="flex items-center gap-1.5"><Users size={13} /> Assignees</span>
                  </td>
                  <td className="border-l border-gray-100 px-3 py-2.5 text-gray-400">
                    {labelCount > 0 ? `${labelCount} label${labelCount > 1 ? "s" : ""}` : (
                      <span className="flex items-center gap-1.5"><Tag size={13} /> Select labels</span>
                    )}
                  </td>
                  <td className="border-l border-gray-100 px-3 py-2.5 text-gray-400">
                    <span className="flex items-center gap-1.5"><Boxes size={13} /> Modules</span>
                  </td>
                </tr>
              );
            })}
            {ordered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">No work items in this project yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
