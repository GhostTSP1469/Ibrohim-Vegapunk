import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useActivityStore } from "./ActivityZustand";

export default function Activity() {
  const { workspaceSlug = "", projectId = "", issueId = "" } = useParams();
  const { activity, loading, error, fetchActivity } = useActivityStore();

  useEffect(() => {
    void fetchActivity(workspaceSlug, projectId, issueId);
  }, [fetchActivity, workspaceSlug, projectId, issueId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Activity</h1>
      {error && <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className="space-y-2">
        {activity.map((a) => (
          <li key={a.id} className="rounded-lg border bg-white px-3 py-2 text-sm">
            <span className="font-medium">{a.actor?.display_name ?? a.actor_id}</span>{" "}
            <span className="text-gray-600">{a.action}</span>
            {a.field && <span className="text-gray-400"> · {a.field}</span>}
            <span className="ml-2 text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
          </li>
        ))}
        {!loading && activity.length === 0 && <li className="text-gray-400">No activity yet.</li>}
      </ul>
    </div>
  );
}
