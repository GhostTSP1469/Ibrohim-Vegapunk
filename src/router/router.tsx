import { createBrowserRouter, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import Auth from "../pages/Auth/Auth";
import Layout from "../Layout/Layout";
import Workspace from "../pages/Workspace/Workspace";
import { getToken } from "../api";

// Guards the app area: no access token → bounce to /auth.
function Protected({ children }: { children: ReactNode }) {
  return getToken() ? children : <Navigate to="/auth" replace />;
}

export const router = createBrowserRouter([
  { path: "/auth", element: <Auth /> },
  {
    path: "/",
    element: (
      <Protected>
        <Layout />
      </Protected>
    ),
    children: [{ index: true, element: <Workspace /> }],
  },
]);
