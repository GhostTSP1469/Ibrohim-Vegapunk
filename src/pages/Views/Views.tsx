import { useParams } from "react-router-dom";

export default function Views() {
  const { workspaceSlug = "", projectId = "" } = useParams();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Views</h1>
      <p className="text-sm text-gray-500">
        Workspace: <span className="font-medium text-gray-700">{workspaceSlug}</span>
        {" · "}
        Project: <span className="font-medium text-gray-700">{projectId}</span>
      </p>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-gray-400">Custom views will appear here.</p>
      </div>
    </div>
  );
}
