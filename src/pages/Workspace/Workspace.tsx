import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Pencil, Boxes } from "lucide-react";
import { useWorkspaceStore, type Workspace as Ws } from "./WorkspaceZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

export default function Workspace() {
  const { workspaces, loading, error, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eSlug, setESlug] = useState("");

  useEffect(() => {
    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createWorkspace({ name, slug })) { setName(""); setSlug(""); }
  };
  const startEdit = (w: Ws) => {
    setEditId(w.id);
    setEName(w.name);
    setESlug(w.slug);
  };
  const onSaveEdit = async (e: FormEvent, w: Ws) => {
    e.preventDefault();
    if (await updateWorkspace(w.slug, { name: eName, slug: eSlug })) setEditId(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Workspaces" count={workspaces.length} subtitle="Your teams and their projects." />
      <ErrorBanner error={error} />

      <form onSubmit={onCreate} className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
        <input className={field + " flex-1"} placeholder="Workspace name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={field + " w-40"} placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <button className={primaryBtn} disabled={loading}><Plus size={16} /> Create</button>
      </form>

      {workspaces.length === 0 && !loading ? (
        <EmptyState icon={<Boxes size={28} />} text="No workspaces yet — create your first one above." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w) =>
            editId === w.id ? (
              <form key={w.id} onSubmit={(e) => onSaveEdit(e, w)} className={`space-y-2 p-4 ${card}`}>
                <input className={field} value={eName} onChange={(e) => setEName(e.target.value)} required />
                <input className={field} value={eSlug} onChange={(e) => setESlug(e.target.value)} required />
                <div className="flex gap-2">
                  <button className={primaryBtn} disabled={loading}>Save</button>
                  <button type="button" onClick={() => setEditId(null)} className={ghostBtn}>Cancel</button>
                </div>
              </form>
            ) : (
              <div key={w.id} className={`group relative p-4 transition hover:-translate-y-0.5 hover:shadow-md ${card}`}>
                <Link to={`/w/${w.slug}/projects`} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-lg font-semibold text-white shadow-sm">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">{w.name}</p>
                    <p className="truncate text-xs text-gray-400">/{w.slug}</p>
                  </div>
                </Link>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => startEdit(w)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"><Pencil size={15} /></button>
                  <button onClick={() => deleteWorkspace(w.slug)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
