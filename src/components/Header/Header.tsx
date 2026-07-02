import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../pages/Auth/AuthZustand";

const field =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";

export default function Header() {
  const { user, loading, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.display_name);
      setAvatar(user.avatar_url ?? "");
    }
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    await updateProfile({ display_name: name.trim() || undefined, avatar_url: avatar.trim() || undefined });
    setOpen(false);
  };

  const onLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const avatarSrc = user?.avatar_url ?? "https://placehold.co/64x64/ede9fe/7c3aed?text=%20";

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-100"
      >
        <img src={avatarSrc} alt="" className="h-8 w-8 rounded-full border object-cover" />
        <span className="text-sm font-medium text-gray-700">{user?.display_name ?? "…"}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-4 top-14 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Edit profile
            </p>
            <form onSubmit={onSave} className="space-y-2">
              <input className={field} placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={field} placeholder="Avatar URL" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Save
              </button>
            </form>
            <button
              onClick={onLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </>
      )}
    </header>
  );
}
