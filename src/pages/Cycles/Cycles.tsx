import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useCyclesStore, type Cycle } from "./CyclesZustand";
import { toIsoDate } from "../../api";

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

export default function Cycles() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { cycles, loading, error, fetchCycles, createCycle, updateCycle, deleteCycle } =
    useCyclesStore();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  useEffect(() => {
    void fetchCycles(workspaceSlug, projectId);
  }, [fetchCycles, workspaceSlug, projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await createCycle(workspaceSlug, projectId, {
      name,
      start_date: toIsoDate(start),
      end_date: toIsoDate(end),
    });
    if (ok) {
      setName("");
      setStart("");
      setEnd("");
    }
  };

  const startEdit = (c: Cycle) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditStart(c.start_date ? c.start_date.slice(0, 10) : "");
    setEditEnd(c.end_date ? c.end_date.slice(0, 10) : "");
  };

  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    const ok = await updateCycle(workspaceSlug, projectId, id, {
      name: editName,
      start_date: toIsoDate(editStart),
      end_date: toIsoDate(editEnd),
    });
    if (ok) setEditId(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Cycles</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input className={input + " flex-1"} placeholder="Cycle name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="date" className={input} value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" className={input} value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className={btn} disabled={loading}>Create</button>
      </form>

      <ul className="space-y-2">
        {cycles.map((c) =>
          editId === c.id ? (
            <li key={c.id}>
              <form onSubmit={(e) => onSaveEdit(e, c.id)} className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2">
                <input className={input + " flex-1"} value={editName} onChange={(e) => setEditName(e.target.value)} required />
                <input type="date" className={input} value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                <input type="date" className={input} value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                <button className={btn} disabled={loading}>Save</button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
              </form>
            </li>
          ) : (
            <li key={c.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
              <span>
                <span className="font-medium">{c.name}</span>
                {c.start_date && <span className="ml-2 text-xs text-gray-400">{c.start_date.slice(0, 10)} → {c.end_date?.slice(0, 10)}</span>}
              </span>
              <span className="flex gap-3">
                <button onClick={() => startEdit(c)} className="text-sm text-brand-600 hover:underline">Edit</button>
                <button onClick={() => deleteCycle(workspaceSlug, projectId, c.id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </span>
            </li>
          ),
        )}
        {!loading && cycles.length === 0 && <li className="text-gray-400">No cycles yet.</li>}
      </ul>
    </div>
  );
}
