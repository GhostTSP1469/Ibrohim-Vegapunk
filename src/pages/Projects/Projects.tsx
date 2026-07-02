import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useProjectsStore, type Project } from "./ProjectsZustand";

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

export default function Projects() {
  const { workspaceSlug = "" } = useParams();
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } =
    useProjectsStore();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    void fetchProjects(workspaceSlug);
  }, [fetchProjects, workspaceSlug]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createProject(workspaceSlug, { name, identifier })) {
      setName("");
      setIdentifier("");
    }
  };

  const startEdit = (p: Project) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditDesc(p.description ?? "");
  };

  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateProject(workspaceSlug, id, { name: editName, description: editDesc || undefined })) {
      setEditId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Projects</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input className={input + " flex-1"} placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={input + " w-32"} placeholder="ID (MOB)" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <button className={btn} disabled={loading}>
          <Plus size={16} /> Create
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) =>
          editId === p.id ? (
            <form key={p.id} onSubmit={(e) => onSaveEdit(e, p.id)} className="space-y-2 rounded-xl border border-brand-300 bg-white p-4">
              <input className={input + " w-full"} value={editName} onChange={(e) => setEditName(e.target.value)} required />
              <input className={input + " w-full"} placeholder="Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              <div className="flex gap-2">
                <button className={btn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
              </div>
            </form>
          ) : (
            <div key={p.id} className="group relative rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm">
              <Link to={`/w/${workspaceSlug}/projects/${p.id}/issues`} className="block">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">{p.identifier}</span>
                </div>
                <p className="truncate font-medium text-gray-800">{p.name}</p>
                {p.description && <p className="mt-1 truncate text-xs text-gray-400">{p.description}</p>}
              </Link>
              <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => startEdit(p)} className="text-gray-300 hover:text-brand-600"><Pencil size={16} /></button>
                <button onClick={() => deleteProject(workspaceSlug, p.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ),
        )}
      </div>
      {!loading && projects.length === 0 && <p className="text-sm text-gray-400">No projects yet.</p>}
    </div>
  );
}
