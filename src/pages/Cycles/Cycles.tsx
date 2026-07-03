import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, RefreshCw, CalendarDays } from "lucide-react";
import { useCyclesStore, type Cycle } from "./CyclesZustand";
import { toIsoDate } from "../../api";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

export default function Cycles() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { cycles, loading, error, fetchCycles, createCycle, updateCycle, deleteCycle } = useCyclesStore();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eStart, setEStart] = useState("");
  const [eEnd, setEEnd] = useState("");

  useEffect(() => {
    void fetchCycles(workspaceSlug, projectId);
  }, [fetchCycles, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await createCycle(workspaceSlug, projectId, { name, start_date: toIsoDate(start), end_date: toIsoDate(end) });
    if (ok) { setName(""); setStart(""); setEnd(""); }
  };
  const startEdit = (c: Cycle) => {
    setEditId(c.id);
    setEName(c.name);
    setEStart(c.start_date ? c.start_date.slice(0, 10) : "");
    setEEnd(c.end_date ? c.end_date.slice(0, 10) : "");
  };
  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateCycle(workspaceSlug, projectId, id, { name: eName, start_date: toIsoDate(eStart), end_date: toIsoDate(eEnd) })) setEditId(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Cycles" count={cycles.length} subtitle="Time-boxed sprints for planning work." />
      <ErrorBanner error={error} />

      <form onSubmit={onCreate} className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
        <input className={field + " flex-1"} placeholder="Cycle name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="date" className={field + " w-40"} value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" className={field + " w-40"} value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className={primaryBtn} disabled={loading}><Plus size={16} /> Add</button>
      </form>

      {cycles.length === 0 && !loading ? (
        <EmptyState icon={<RefreshCw size={28} />} text="No cycles yet." />
      ) : (
        <div className={`divide-y divide-gray-100 ${card}`}>
          {cycles.map((c) =>
            editId === c.id ? (
              <form key={c.id} onSubmit={(e) => onSaveEdit(e, c.id)} className="flex flex-wrap items-center gap-2 p-3">
                <input className={field + " flex-1"} value={eName} onChange={(e) => setEName(e.target.value)} required />
                <input type="date" className={field + " w-40"} value={eStart} onChange={(e) => setEStart(e.target.value)} />
                <input type="date" className={field + " w-40"} value={eEnd} onChange={(e) => setEEnd(e.target.value)} />
                <button className={primaryBtn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className={ghostBtn}>Cancel</button>
              </form>
            ) : (
              <div key={c.id} className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><RefreshCw size={15} /></span>
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{c.name}</span>
                    {c.start_date && (
                      <span className="flex items-center gap-1 text-xs text-gray-400"><CalendarDays size={12} /> {c.start_date.slice(0, 10)} → {c.end_date?.slice(0, 10)}</span>
                    )}
                  </span>
                </span>
                <span className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => startEdit(c)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"><Pencil size={15} /></button>
                  <button onClick={() => deleteCycle(workspaceSlug, projectId, c.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
