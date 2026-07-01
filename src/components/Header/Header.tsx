import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../pages/Auth/AuthZustand";

export default function Header() {
  const { user, loading, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  // Pre-fill the edit fields with the current profile (and keep them in sync
  // after a successful save, when `user` changes).
  useEffect(() => {
    if (user) {
      setName(user.display_name);
      setAvatar(user.avatar_url ?? "");
    }
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    await updateProfile({
      display_name: name.trim() || undefined,
      avatar_url: avatar.trim() || undefined,
    });
  };

  const onLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-4 py-3">
      {/* current user */}
      <div className="flex items-center gap-3">
        <img
          src={user?.avatar_url ?? "https://placehold.co/40x40?text=?"}
          alt=""
          className="h-10 w-10 rounded-full border object-cover"
        />
        <span className="font-semibold text-gray-800">{user?.display_name ?? "..."}</span>
      </div>

      {/* edit display name + avatar */}
      <form onSubmit={onSave} className="flex flex-wrap items-center gap-2">
        <input
          className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
          placeholder="Avatar URL"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Save
        </button>
      </form>

      <button
        onClick={onLogout}
        className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
      >
        Logout
      </button>
    </header>
  );
}
