import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useLabelsStore, type Label } from "./LabelsZustand";

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

export default function Labels() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { labels, loading, error, fetchLabels, createLabel, updateLabel, deleteLabel } =
    useLabelsStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3f76ff");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3f76ff");

  useEffect(() => {
    void fetchLabels(workspaceSlug, projectId);
  }, [fetchLabels, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createLabel(workspaceSlug, projectId, { name, color })) setName("");
  };

  const startEdit = (l: Label) => {
    setEditId(l.id);
    setEditName(l.name);
    setEditColor(l.color);
  };

  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateLabel(workspaceSlug, projectId, id, { name: editName, color: editColor })) {
      setEditId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Labels</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input className={input + " flex-1"} placeholder="Label name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded border" />
        <button className={btn} disabled={loading}>Create</button>
      </form>

      <ul className="space-y-2">
        {labels.map((l) =>
          editId === l.id ? (
            <li key={l.id}>
              <form onSubmit={(e) => onSaveEdit(e, l.id)} className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2">
                <input className={input + " flex-1"} value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-9 w-12 rounded border" />
                <button className={btn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
              </form>
            </li>
          ) : (
            <li key={l.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
              <span className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: l.color }} />
                {l.name}
              </span>
              <span className="flex gap-3">
                <button onClick={() => startEdit(l)} className="text-sm text-brand-600 hover:underline">Edit</button>
                <button onClick={() => deleteLabel(workspaceSlug, projectId, l.id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ),
        )}
        {!loading && labels.length === 0 && <li className="text-gray-400">No labels yet.</li>}
      </ul>
    </div>
  );
}
