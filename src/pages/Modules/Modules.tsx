import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useModulesStore, type Module } from "./ModulesZustand";

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

const STATUSES = ["backlog", "in_progress", "paused", "completed", "cancelled"];

export default function Modules() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { modules, loading, error, fetchModules, createModule, updateModule, deleteModule } =
    useModulesStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("backlog");

  useEffect(() => {
    void fetchModules(workspaceSlug, projectId);
  }, [fetchModules, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createModule(workspaceSlug, projectId, { name, description: description || undefined })) {
      setName("");
      setDescription("");
    }
  };

  const startEdit = (m: Module) => {
    setEditId(m.id);
    setEditName(m.name);
    setEditDesc(m.description ?? "");
    setEditStatus(m.status ?? "backlog");
  };

  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    const ok = await updateModule(workspaceSlug, projectId, id, {
      name: editName,
      description: editDesc || undefined,
      status: editStatus,
    });
    if (ok) setEditId(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Modules</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input className={input + " flex-1"} placeholder="Module name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={input + " flex-1"} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className={btn} disabled={loading}>Create</button>
      </form>

      <ul className="space-y-2">
        {modules.map((m) =>
          editId === m.id ? (
            <li key={m.id}>
              <form onSubmit={(e) => onSaveEdit(e, m.id)} className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2">
                <input className={input + " flex-1"} value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <input className={input + " flex-1"} placeholder="Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                <select className={input} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button className={btn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
              </form>
            </li>
          ) : (
            <li key={m.id} className="flex items-start justify-between rounded-lg border bg-white px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.name}</span>
                  {m.status && <span className="text-xs text-gray-400">{m.status}</span>}
                </div>
                {m.description && <p className="mt-0.5 text-sm text-gray-500">{m.description}</p>}
              </div>
              <span className="flex shrink-0 gap-3">
                <button onClick={() => startEdit(m)} className="text-sm text-brand-600 hover:underline">Edit</button>
                <button onClick={() => deleteModule(workspaceSlug, projectId, m.id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ),
        )}
        {!loading && modules.length === 0 && <li className="text-gray-400">No modules yet.</li>}
      </ul>
    </div>
  );
}
