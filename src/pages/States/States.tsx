import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useStatesStore, type StateGroup, type WorkflowState } from "./StatesZustand";

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

const GROUPS: StateGroup[] = ["backlog", "unstarted", "started", "completed", "cancelled"];

export default function States() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { states, loading, error, fetchStates, createState, updateState, deleteState } =
    useStatesStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [group, setGroup] = useState<StateGroup>("backlog");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6b7280");
  const [editGroup, setEditGroup] = useState<StateGroup>("backlog");

  useEffect(() => {
    void fetchStates(workspaceSlug, projectId);
  }, [fetchStates, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createState(workspaceSlug, projectId, { name, color, group })) setName("");
  };

  const startEdit = (s: WorkflowState) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditColor(s.color);
    setEditGroup(s.group);
  };

  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateState(workspaceSlug, projectId, id, { name: editName, color: editColor, group: editGroup })) {
      setEditId(null);
    }
  };

  const onDelete = (id: string) =>
    deleteState(
      workspaceSlug,
      projectId,
      id,
      (states.find((t) => t.id !== id && t.is_default) ?? states.find((t) => t.id !== id))?.id,
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">States</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input className={input + " flex-1"} placeholder="State name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded border" />
        <select value={group} onChange={(e) => setGroup(e.target.value as StateGroup)} className={input}>
          {GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button className={btn} disabled={loading}>Create</button>
      </form>

      <ul className="space-y-2">
        {states.map((s) =>
          editId === s.id ? (
            <li key={s.id}>
              <form onSubmit={(e) => onSaveEdit(e, s.id)} className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2">
                <input className={input + " flex-1"} value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-9 w-12 rounded border" />
                <select value={editGroup} onChange={(e) => setEditGroup(e.target.value as StateGroup)} className={input}>
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <button className={btn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
              </form>
            </li>
          ) : (
            <li key={s.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-gray-400">{s.group}</span>
              </span>
              <span className="flex gap-3">
                <button onClick={() => startEdit(s)} className="text-sm text-brand-600 hover:underline">Edit</button>
                <button onClick={() => onDelete(s.id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ),
        )}
        {!loading && states.length === 0 && <li className="text-gray-400">No states yet.</li>}
      </ul>
    </div>
  );
}
