import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Boxes } from "lucide-react";
import { useModulesStore, type Module } from "./ModulesZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

const STATUSES = ["backlog", "in_progress", "paused", "completed", "cancelled"];

const statusColor: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Modules() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { modules, loading, error, fetchModules, createModule, updateModule, deleteModule } = useModulesStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eStatus, setEStatus] = useState("backlog");

  useEffect(() => {
    void fetchModules(workspaceSlug, projectId);
  }, [fetchModules, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createModule(workspaceSlug, projectId, { name, description: description || undefined })) { setName(""); setDescription(""); }
  };
  const startEdit = (m: Module) => {
    setEditId(m.id);
    setEName(m.name);
    setEDesc(m.description ?? "");
    setEStatus(m.status ?? "backlog");
  };
  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateModule(workspaceSlug, projectId, id, { name: eName, description: eDesc || undefined, status: eStatus })) setEditId(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Modules" count={modules.length} subtitle="Group related issues into deliverables." />
      <ErrorBanner error={error} />

      <form onSubmit={onCreate} className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
        <input className={field + " flex-1"} placeholder="Module name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={field + " flex-1"} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className={primaryBtn} disabled={loading}><Plus size={16} /> Add</button>
      </form>

      {modules.length === 0 && !loading ? (
        <EmptyState icon={<Boxes size={28} />} text="No modules yet." />
      ) : (
        <div className={`divide-y divide-gray-100 ${card}`}>
          {modules.map((m) =>
            editId === m.id ? (
              <form key={m.id} onSubmit={(e) => onSaveEdit(e, m.id)} className="flex flex-wrap items-center gap-2 p-3">
                <input className={field + " flex-1"} value={eName} onChange={(e) => setEName(e.target.value)} required />
                <input className={field + " flex-1"} placeholder="Description" value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
                <select className={field + " w-36"} value={eStatus} onChange={(e) => setEStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className={primaryBtn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className={ghostBtn}>Cancel</button>
              </form>
            ) : (
              <div key={m.id} className="group flex items-start justify-between px-4 py-3 hover:bg-gray-50">
                <span className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Boxes size={15} /></span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{m.name}</span>
                      {m.status && <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${statusColor[m.status] ?? "bg-gray-100 text-gray-600"}`}>{m.status}</span>}
                    </span>
                    {m.description && <span className="mt-0.5 block truncate text-sm text-gray-500">{m.description}</span>}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => startEdit(m)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"><Pencil size={15} /></button>
                  <button onClick={() => deleteModule(workspaceSlug, projectId, m.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
