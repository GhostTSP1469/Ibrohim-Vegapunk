import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspaceStore, type Workspace } from "../Workspace/WorkspaceZustand";

const COMPANY_SIZES = ["Just myself", "2-10", "11-50", "51-200", "201-500", "500+"];
const TIMEZONES = ["UTC", "GMT", "Europe/London", "Europe/Moscow", "Asia/Tashkent", "Asia/Dubai", "America/New_York", "America/Los_Angeles", "Asia/Tokyo"];

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const labelCls = "mb-1.5 block text-sm font-medium text-gray-600";

export default function WorkspaceSettings() {
  const { workspaceSlug = "" } = useParams();
  const navigate = useNavigate();
  const { getWorkspace, updateWorkspace, deleteWorkspace, error } = useWorkspaceStore();

  const [ws, setWs] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [companySize, setCompanySize] = useState("2-10");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    void (async () => {
      const w = await getWorkspace(workspaceSlug);
      if (w) {
        setWs(w);
        setName(w.name);
        setSlug(w.slug);
      }
    })();
  }, [getWorkspace, workspaceSlug]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateWorkspace(workspaceSlug, { name: name.trim(), slug: slug.trim() });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (slug.trim() !== workspaceSlug) navigate(`/w/${slug.trim()}/settings`, { replace: true });
    }
  };

  const onDelete = async () => {
    if (await deleteWorkspace(workspaceSlug)) navigate("/", { replace: true });
  };

  const initial = (name || ws?.name || "W").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* Identity */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-500 text-2xl font-bold text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{name || ws?.name}</h1>
          <p className="text-sm text-gray-500">app.plane.so/{slug || workspaceSlug}</p>
          <button type="button" className="mt-0.5 text-sm font-medium text-brand-600 hover:text-brand-700">Upload logo</button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={labelCls}>Workspace name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Company size</label>
            <select className={inputCls} value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
              {COMPANY_SIZES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Workspace URL</label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-white pl-3 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <span className="select-none text-sm text-gray-400">app.plane.so/</span>
              <input className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-gray-800 outline-none" value={slug} onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())} required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Workspace Timezone</label>
            <select className={inputCls} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Updating…" : saved ? "Updated ✓" : "Update workspace"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h3 className="font-semibold text-gray-900">Delete this workspace</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tread carefully here. You delete your workspace, you lose all your data, your members can't access projects and pages,
            and we can't retrieve any of it for you. Proceed only if you are sure you want your workspace deleted.
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Delete “{ws?.name}”?</h2>
            <p className="mt-2 text-sm text-gray-500">This permanently deletes the workspace and everything in it. This can't be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
              <button onClick={onDelete} className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700">Delete workspace</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
