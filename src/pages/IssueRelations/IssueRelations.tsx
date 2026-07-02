import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useIssueRelationsStore, type RelationType } from "./IssueRelationsZustand";

const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50";

const TYPES: RelationType[] = ["blocks", "blocked_by", "relates_to", "duplicate", "duplicate_of"];

export default function IssueRelations() {
  const { workspaceSlug = "", projectId = "", issueId = "" } = useParams();
  const { relations, loading, error, fetchRelations, createRelation, deleteRelation } =
    useIssueRelationsStore();
  const [relatedId, setRelatedId] = useState("");
  const [type, setType] = useState<RelationType>("relates_to");

  useEffect(() => {
    void fetchRelations(workspaceSlug, projectId, issueId);
  }, [fetchRelations, workspaceSlug, projectId, issueId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await createRelation(workspaceSlug, projectId, issueId, {
      related_issue_id: relatedId,
      relation_type: type,
    });
    if (ok) setRelatedId("");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Issue relations</h1>
      {error && <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as RelationType)} className={input + " max-w-40"}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input className={input + " max-w-xs"} placeholder="Related issue ID" value={relatedId} onChange={(e) => setRelatedId(e.target.value)} required />
        <button className={btn} disabled={loading}>Add</button>
      </form>

      <ul className="space-y-2">
        {relations.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{r.relation_type}</span> → {r.related_issue_id}
            </span>
            <button onClick={() => deleteRelation(workspaceSlug, projectId, issueId, r.id)} className="text-red-600 hover:underline">
              Delete
            </button>
          </li>
        ))}
        {!loading && relations.length === 0 && <li className="text-gray-400">No relations yet.</li>}
      </ul>
    </div>
  );
}
