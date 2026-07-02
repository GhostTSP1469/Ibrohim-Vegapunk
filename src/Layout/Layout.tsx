import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import { useAuthStore } from "../pages/Auth/AuthZustand";
import { getToken } from "../api";

export default function Layout() {
  const { user, getMe } = useAuthStore();

  // Restore the user after a page refresh (token persists, store does not).
  useEffect(() => {
    if (!user && getToken()) void getMe();
  }, [user, getMe]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">
            <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
