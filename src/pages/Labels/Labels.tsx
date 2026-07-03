import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useLabelsStore, type Label } from "./LabelsZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

export default function Labels() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { labels, loading, error, fetchLabels, createLabel, updateLabel, deleteLabel } = useLabelsStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3f76ff");

  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eColor, setEColor] = useState("#3f76ff");

  useEffect(() => {
    void fetchLabels(workspaceSlug, projectId);
  }, [fetchLabels, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createLabel(workspaceSlug, projectId, { name, color })) setName("");
  };
  const startEdit = (l: Label) => {
    setEditId(l.id);
    setEName(l.name);
    setEColor(l.color);
  };
  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateLabel(workspaceSlug, projectId, id, { name: eName, color: eColor })) setEditId(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Labels" count={labels.length} subtitle="Tag issues to organize and filter them." />
      <ErrorBanner error={error} />

      <form onSubmit={onCreate} className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
        <input className={field + " flex-1"} placeholder="Label name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-10 cursor-pointer rounded border border-gray-200" />
        <button className={primaryBtn} disabled={loading}><Plus size={16} /> Add</button>
      </form>

      {labels.length === 0 && !loading ? (
        <EmptyState icon={<Tag size={28} />} text="No labels yet." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {labels.map((l) =>
            editId === l.id ? (
              <form key={l.id} onSubmit={(e) => onSaveEdit(e, l.id)} className={`flex items-center gap-2 p-2 ${card}`}>
                <input className={field + " w-40"} value={eName} onChange={(e) => setEName(e.target.value)} required />
                <input type="color" value={eColor} onChange={(e) => setEColor(e.target.value)} className="h-8 w-9 rounded border border-gray-200" />
                <button className={primaryBtn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className={ghostBtn}>Cancel</button>
              </form>
            ) : (
              <span key={l.id} className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-2 text-sm shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                <span className="font-medium text-gray-700">{l.name}</span>
                <span className="ml-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => startEdit(l)} className="rounded p-1 text-gray-400 hover:text-brand-600"><Pencil size={13} /></button>
                  <button onClick={() => deleteLabel(workspaceSlug, projectId, l.id)} className="rounded p-1 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                </span>
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
