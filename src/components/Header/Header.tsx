import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {LogOut,SlidersHorizontal,Inbox,HelpCircle,Shapes,Waypoints,Search, Plus, Settings} from "lucide-react";
import { useAuthStore } from "../../pages/Auth/AuthZustand";

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState<"workspace" | "profile" | null>(null);

  const displayName = user?.display_name ?? "…";
  const email = user?.email ?? "";

  const onLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-indigo-600 shadow-lg shadow-emerald-500/25">
          <Waypoints size={15} className="text-white" strokeWidth={2.4} />
        </div> 
        <div className="group flex w-72 items-center gap-2 rounded-lg border border-white/15 px-3 py-2 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/30 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400">
  <Search
    size={15}
    className="shrink-0 text-gray-500 transition-colors duration-200 group-focus-within:text-emerald-400"
  />
  <input
    type="text"
    placeholder="Search..."
    className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none"
  />
  <kbd className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
    ⌘
  </kbd>
</div>
      {/* Right: utility icons + profile */}
      <div className="flex items-center gap-2">
        <button className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors ">
          Get Started
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors ">
          <Inbox size={17} />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors ">
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
                <Link
  to="/"
  className="flex items-center gap-1.5 rounded-full  px-3 py-1.5 text-xs font-semibold text-gray-400 mt-2"
>
  <Plus size={14} />
  Create workspace
</Link>
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
