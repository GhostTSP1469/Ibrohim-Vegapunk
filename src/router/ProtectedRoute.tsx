import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../api";

// Guards the app shell: no access token → bounce to /auth.
export function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/auth" replace />;
}
