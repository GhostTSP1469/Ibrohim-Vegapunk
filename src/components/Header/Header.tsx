import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Check,
  Settings,
  Plus,
  Mail,
  LogOut,
  SlidersHorizontal,
  Inbox,
  HelpCircle,
  Shapes,
} from "lucide-react";
import { useAuthStore } from "../../pages/Auth/AuthZustand";

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState<"workspace" | "profile" | null>(null);

  const workspaceName = user?.display_name ?? "…";
  const workspaceInitial = workspaceName.charAt(0).toUpperCase();
  const displayName = user?.display_name ?? "…";
  const email = user?.email ?? "";

  const onLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: workspace switcher */}
      <div className="relative">
        <button
          onClick={() => setOpenMenu((m) => (m === "workspace" ? null : "workspace"))}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
            {workspaceInitial}
          </div>
          <span className="text-sm font-semibold text-gray-800">{workspaceName}</span>
          <ChevronDown
            size={15}
            className={`text-gray-400 transition-transform duration-200 ${
              openMenu === "workspace" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openMenu === "workspace" && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
            <div className="absolute left-0 top-11 z-20 w-80 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
              <div className="px-3 pb-2 pt-1.5">
                <p className="truncate text-xs text-gray-400">{email}</p>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
                  {workspaceInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{workspaceName}</p>
                  <p className="truncate text-xs text-gray-400">{email}</p>
                </div>
                <Check size={16} className="shrink-0 text-gray-500" />
              </div>

              <div className="px-3 pb-1 pt-2">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    navigate("/settings");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Settings size={15} />
                  Settings
                </button>
              </div>

              <div className="my-1 border-t border-gray-100" />

              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50">
                <Plus size={16} className="text-gray-400" />
                Create workspace
              </button>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50">
                <Mail size={16} className="text-gray-400" />
                Workspace invites
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: utility icons + profile */}
      <div className="flex items-center gap-2">
        <button className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
          Get Started
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100">
          <Inbox size={17} />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100">
          <HelpCircle size={17} />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpenMenu((m) => (m === "profile" ? null : "profile"))}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-gray-200"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-300 via-orange-200 to-yellow-50 text-sm font-bold text-amber-900">
                <Shapes size={16} strokeWidth={2.2} />
              </div>
            )}
          </button>

          {openMenu === "profile" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-11 z-20 w-72 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-50 px-4 py-5">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-300 via-orange-200 to-yellow-50">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Shapes size={22} className="text-amber-900" strokeWidth={2.2} />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                    <p className="truncate text-xs text-gray-400">{email}</p>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      navigate("/settings");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      navigate("/preferences");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <SlidersHorizontal size={16} className="text-gray-400" />
                    Preferences
                  </button>
                </div>

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
