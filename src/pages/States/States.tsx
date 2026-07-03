import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Circle } from "lucide-react";
import { useStatesStore, type StateGroup, type WorkflowState } from "./StatesZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

const GROUPS: StateGroup[] = ["backlog", "unstarted", "started", "completed", "cancelled"];

export default function States() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { states, loading, error, fetchStates, createState, updateState, deleteState } = useStatesStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [group, setGroup] = useState<StateGroup>("backlog");

  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eColor, setEColor] = useState("#6b7280");
  const [eGroup, setEGroup] = useState<StateGroup>("backlog");

  useEffect(() => {
    void fetchStates(workspaceSlug, projectId);
  }, [fetchStates, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createState(workspaceSlug, projectId, { name, color, group })) setName("");
  };
  const startEdit = (s: WorkflowState) => {
    setEditId(s.id);
    setEName(s.name);
    setEColor(s.color);
    setEGroup(s.group);
  };
  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateState(workspaceSlug, projectId, id, { name: eName, color: eColor, group: eGroup })) setEditId(null);
  };
  const onDelete = (id: string) =>
    deleteState(workspaceSlug, projectId, id, (states.find((t) => t.id !== id && t.is_default) ?? states.find((t) => t.id !== id))?.id);

  return (
    <div className="space-y-5">
      <PageHeader title="States" count={states.length} subtitle="Workflow stages issues move through." />
      <ErrorBanner error={error} />

      <form onSubmit={onCreate} className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
        <input className={field + " flex-1"} placeholder="State name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-10 cursor-pointer rounded border border-gray-200" />
        <select value={group} onChange={(e) => setGroup(e.target.value as StateGroup)} className={field + " w-40"}>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button className={primaryBtn} disabled={loading}><Plus size={16} /> Add</button>
      </form>

      {states.length === 0 && !loading ? (
        <EmptyState icon={<Circle size={28} />} text="No states yet." />
      ) : (
        <div className={`divide-y divide-gray-100 ${card}`}>
          {states.map((s) =>
            editId === s.id ? (
              <form key={s.id} onSubmit={(e) => onSaveEdit(e, s.id)} className="flex flex-wrap items-center gap-2 p-3">
                <input className={field + " flex-1"} value={eName} onChange={(e) => setEName(e.target.value)} required />
                <input type="color" value={eColor} onChange={(e) => setEColor(e.target.value)} className="h-9 w-10 rounded border border-gray-200" />
                <select value={eGroup} onChange={(e) => setEGroup(e.target.value as StateGroup)} className={field + " w-40"}>
                  {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <button className={primaryBtn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className={ghostBtn}>Cancel</button>
              </form>
            ) : (
              <div key={s.id} className="group flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                <span className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full ring-2 ring-white ring-offset-1 ring-offset-gray-100" style={{ background: s.color }} />
                  <span className="text-sm font-medium text-gray-800">{s.name}</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">{s.group}</span>
                </span>
                <span className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => startEdit(s)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"><Pencil size={15} /></button>
                  <button onClick={() => onDelete(s.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
