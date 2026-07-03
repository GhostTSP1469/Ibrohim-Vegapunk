import { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout/Layout";
import { ProtectedRoute } from "./router/ProtectedRoute";
import {Auth,Workspace,Projects,States,Labels,Issues,Comments,Cycles,Modules,IssueRelations,Activity,Attachments,Notifications,Overview,WorkItems,Views,Pages,Settings,Preferences,Friends,Messages,Wiki,AI,
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
            { path: "friends", element: <Friends /> },
            { path: "messages", element: <Messages /> },
            { path: "settings", element: <Settings /> },
            { path: "preferences", element: <Preferences /> },
            { path: "wiki", element: <Wiki /> },
            { path: "ai", element: <AI /> },
            { path: "w/:workspaceSlug/projects", element: <Projects /> },
            { path: "w/:workspaceSlug/notifications", element: <Notifications /> },
            { path: `${wp}/overview`, element: <Overview /> },
            { path: `${wp}/work-items`, element: <WorkItems /> },
            { path: `${wp}/views`, element: <Views /> },
            { path: `${wp}/pages`, element: <Pages /> },
            { path: `${wp}/states`, element: <States /> },
            { path: `${wp}/labels`, element: <Labels /> },
            { path: `${wp}/issues`, element: <Issues /> },
            { path: `${wp}/cycles`, element: <Cycles /> },
            { path: `${wp}/modules`, element: <Modules /> },
            { path: `${wpi}/comments`, element: <Comments /> },
            { path: `${wpi}/relations`, element: <IssueRelations /> },
            { path: `${wpi}/activity`, element: <Activity /> },
            { path: `${wpi}/attachments`, element: <Attachments /> },
            { path: `${wpi}/wiki`, element: <Wiki /> },
            { path: `${wpi}/ai`, element: <AI /> },
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
