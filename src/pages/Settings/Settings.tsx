import { useEffect, useState, type FormEvent } from "react";
import { useAuthStore } from "../Auth/AuthZustand";

const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";

export default function Settings() {
  const { user, loading, error, getMe, updateProfile } = useAuthStore();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) void getMe();
  }, [user, getMe]);

  useEffect(() => {
    if (user) {
      setName(user.display_name);
      setAvatar(user.avatar_url ?? "");
    }
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await updateProfile({ display_name: name.trim() || undefined, avatar_url: avatar.trim() || undefined });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Profile settings</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-4">
          <img
            src={avatar || `https://placehold.co/64x64/eef4ff/3f76ff?text=${(name || "?").charAt(0).toUpperCase()}`}
            alt=""
            className="h-16 w-16 rounded-full border object-cover"
          />
          <div>
            <p className="font-medium text-gray-800">{user?.display_name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Display name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Avatar URL</label>
            <input className={input} value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
