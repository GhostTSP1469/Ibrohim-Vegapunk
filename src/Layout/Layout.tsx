import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import { useAuthStore } from "../pages/Auth/AuthZustand";
import { getToken } from "../api";

export default function Layout() {
  const { user, getMe } = useAuthStore();

  // On a page refresh the store is empty but the token persists — restore the user.
  useEffect(() => {
    if (!user && getToken()) {
      void getMe();
    }
  }, [user, getMe]);

  return (
    <div className="flex h-screen w-full bg-gray-100">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex flex-1 flex-col">

        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>

      </div>
    </div>
  );
}