import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useWorkspaceStore, type Workspace as Ws } from "./WorkspaceZustand";

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

export default function Workspace() {
  const { workspaces, loading, error, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } =
    useWorkspaceStore();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  useEffect(() => {
    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createWorkspace({ name, slug })) {
      setName("");
      setSlug("");
    }
  };

  const startEdit = (w: Ws) => {
    setEditId(w.id);
    setEditName(w.name);
    setEditSlug(w.slug);
  };

  const onSaveEdit = async (e: FormEvent, w: Ws) => {
    e.preventDefault();
    if (await updateWorkspace(w.slug, { name: editName, slug: editSlug })) setEditId(null);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Workspaces</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input className={input + " flex-1"} placeholder="Workspace name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={input + " flex-1"} placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <button className={btn} disabled={loading}>
          <Plus size={16} /> Create
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((w) =>
          editId === w.id ? (
            <form key={w.id} onSubmit={(e) => onSaveEdit(e, w)} className="space-y-2 rounded-xl border border-brand-300 bg-white p-4">
              <input className={input + " w-full"} value={editName} onChange={(e) => setEditName(e.target.value)} required />
              <input className={input + " w-full"} value={editSlug} onChange={(e) => setEditSlug(e.target.value)} required />
              <div className="flex gap-2">
                <button className={btn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
              </div>
            </form>
          ) : (
            <div key={w.id} className="group relative rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm">
              <Link to={`/w/${w.slug}/projects`} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 font-semibold text-white">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">{w.name}</p>
                  <p className="truncate text-xs text-gray-400">/{w.slug}</p>
                </div>
              </Link>
              <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => startEdit(w)} className="text-gray-300 hover:text-brand-600"><Pencil size={16} /></button>
                <button onClick={() => deleteWorkspace(w.slug)} className="text-gray-300 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ),
        )}
      </div>
      {!loading && workspaces.length === 0 && <p className="text-sm text-gray-400">No workspaces yet.</p>}
    </div>
  );
}
