import { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout/Layout";
import { ProtectedRoute } from "./router/ProtectedRoute";
import {
  Auth,
  Workspace,
  Projects,
  States,
  Labels,
  Issues,
  Comments,
  Cycles,
  Modules,
  IssueRelations,
  Activity,
  Attachments,
  Notifications,
} from "./router/router";

const wp = "w/:workspaceSlug/projects/:projectId";
const wpi = `${wp}/issues/:issueId`;

export default function App() {
  const router = createBrowserRouter([
    {
      path: "/auth",
      element: <Auth />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <Layout />,
          children: [
            { index: true, element: <Workspace /> },
            { path: "w/:workspaceSlug/projects", element: <Projects /> },
            { path: "w/:workspaceSlug/notifications", element: <Notifications /> },
            { path: `${wp}/states`, element: <States /> },
            { path: `${wp}/labels`, element: <Labels /> },
            { path: `${wp}/issues`, element: <Issues /> },
            { path: `${wp}/cycles`, element: <Cycles /> },
            { path: `${wp}/modules`, element: <Modules /> },
            { path: `${wpi}/comments`, element: <Comments /> },
            { path: `${wpi}/relations`, element: <IssueRelations /> },
            { path: `${wpi}/activity`, element: <Activity /> },
            { path: `${wpi}/attachments`, element: <Attachments /> },
          ],
        },
      ],
    },
  ]);

  return (
    <Suspense
      fallback={<div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>}
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
