import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Trash2, Pencil, ArrowRight, X, Loader2,
  FolderKanban, Sparkles, Rocket, PencilLine,
} from "lucide-react";
import { useWorkspaceStore, type Workspace as Ws } from "./WorkspaceZustand";
import { ErrorBanner } from "../../components/ui/kit";

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const HERO_PHOTOS = [
  { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&q=80", rotate: -6, className: "right-24 top-6 h-20 w-28 hidden sm:block" },
  { src: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&q=80", rotate: 5, className: "right-6 top-16 h-24 w-32" },
  { src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&q=80", rotate: -3, className: "right-16 top-40 h-16 w-24 hidden md:block" },
];

const MODAL_PHOTO = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80";

export default function Workspace() {
  const { workspaces, loading, error, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaceStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ws | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openCreate = () => {
    setEditTarget(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setModalOpen(true);
  };

  const openEdit = (w: Ws) => {
    setEditTarget(w);
    setName(w.name);
    setSlug(w.slug);
    setSlugTouched(true);
    setModalOpen(true);
  };

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = editTarget
        ? await updateWorkspace(editTarget.slug, { name, slug })
        : await createWorkspace({ name, slug });
      if (ok) setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (w: Ws) => {
    setDeletingId(w.id);
    try {
      await deleteWorkspace(w.slug);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes wsFadeUp { from { opacity:0; transform: translateY(10px) scale(0.98);} to { opacity:1; transform: translateY(0) scale(1);} }
        @keyframes wsFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-8px);} }
        @keyframes wsBlob { 0%,100% { transform: translate(0,0) scale(1);} 50% { transform: translate(20px,-15px) scale(1.08);} }
        @keyframes wsShimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }
        @keyframes wsScaleIn { from { opacity:0; transform: scale(0.94) translateY(8px);} to { opacity:1; transform: scale(1) translateY(0);} }
        @keyframes wsFadeIn { from { opacity:0; } to { opacity:1; } }
        .ws-card { animation: wsFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .ws-photo { animation: wsFloat 4.5s ease-in-out infinite; }
        .ws-blob { animation: wsBlob 8s ease-in-out infinite; }
        .ws-skel { background-image: linear-gradient(90deg,#1e293b 0px,#334155 40px,#1e293b 80px); background-size: 600px 100%; animation: wsShimmer 1.4s ease-in-out infinite; }
        .ws-avatar-ring { background: conic-gradient(from 0deg,#10b981,#6366f1,#10b981); animation: spin 3s linear infinite; opacity:0; transition: opacity .35s cubic-bezier(0.22,1,0.36,1); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .group:hover .ws-avatar-ring { opacity:1; }
        .ws-top-bar { transform: scaleX(0); transform-origin:left; transition: transform .4s cubic-bezier(0.22,1,0.36,1); }
        .group:hover .ws-top-bar { transform: scaleX(1); }
        .ws-arrow { transform: translateX(-4px); opacity:0; transition: all .3s cubic-bezier(0.22,1,0.36,1); }
        .group:hover .ws-arrow { transform: translateX(0); opacity:1; }
        .ws-backdrop { animation: wsFadeIn .25s ease both; }
        .ws-modal { animation: wsScaleIn .35s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* ---------- HERO ---------- */}
      <div className="relative overflow-hidden rounded-3xl bg-[#131a2e] p-8 sm:p-10">
        <div className="ws-blob absolute -left-10 -top-16 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="ws-blob absolute -right-10 top-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" style={{ animationDelay: "1.5s" }} />

        {/* floating photo collage — replaces the old emoji stickers */}
        <div className="pointer-events-none absolute inset-0">
          {HERO_PHOTOS.map((p, i) => (
            <img
              key={i}
              src={p.src}
              alt=""
              className={`ws-photo absolute rounded-xl border-2 border-white/10 object-cover shadow-xl ${p.className}`}
              style={{ transform: `rotate(${p.rotate}deg)`, animationDelay: `${i * 0.6}s` }}
            />
          ))}
        </div>

        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              <FolderKanban size={13} /> Team spaces
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Your Workspaces</h1>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Everything your teams are building — projects, cycles, and people — organized in one place.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              <Sparkles size={13} /> {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} synced
            </div>
          </div>

          <button
            onClick={openCreate}
            className="group relative z-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            <Plus size={17} className="transition-transform duration-300 group-hover:rotate-90" />
            New workspace
          </button>
        </div>
      </div>

      <ErrorBanner error={error} />

      {/* ---------- GRID ---------- */}
      {workspaces.length === 0 && loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="ws-skel h-11 w-11 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="ws-skel h-3.5 w-2/3 rounded" />
                  <div className="ws-skel h-2.5 w-1/3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w, i) => (
            <div
              key={w.id}
              className={`ws-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200/70 hover:shadow-lg hover:shadow-emerald-900/5 ${
                deletingId === w.id ? "pointer-events-none opacity-40" : ""
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="ws-top-bar absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#131a2e] via-emerald-500 to-indigo-500" />

              <Link to={`/w/${w.slug}/projects`} className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  <div className="ws-avatar-ring absolute inset-0 rounded-xl blur-[2px]" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-lg font-semibold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-800">{w.name}</p>
                  <p className="truncate text-xs text-gray-400">/{w.slug}</p>
                </div>
                <ArrowRight size={16} className="ws-arrow shrink-0 text-emerald-600" />
              </Link>

              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button onClick={() => openEdit(w)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => onDelete(w)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={openCreate}
            className="ws-card flex min-h-[76px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-transparent p-4 text-sm font-medium text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:text-emerald-600"
            style={{ animationDelay: `${workspaces.length * 50}ms` }}
          >
            <Plus size={16} /> New workspace
          </button>
        </div>
      )}

      {/* ---------- MODAL ---------- */}
      {modalOpen && (
        <div
          className="ws-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/60 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="ws-modal grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* photo side */}
            <div className="relative hidden md:block">
              <img src={MODAL_PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131a2e]/95 via-[#131a2e]/50 to-emerald-900/30" />
              <div className="relative flex h-full flex-col justify-between p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  {editTarget ? <PencilLine size={18} className="text-white" /> : <Rocket size={18} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editTarget ? "Fine-tune this workspace" : "Spin up a new home for your team"}
                  </h3>
                  <p className="mt-2 text-sm text-white/75">
                    Projects, cycles, and people — all organized under one roof, ready in seconds.
                  </p>
                </div>
              </div>
            </div>

            {/* form side */}
            <div className="relative p-6 sm:p-8">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-xl font-semibold text-white shadow-sm">
                  {name.trim() ? name.charAt(0).toUpperCase() : <Rocket size={20} />}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{editTarget ? "Edit workspace" : "Create workspace"}</h2>
                  <p className="text-xs text-gray-400">{editTarget ? "Update the name or URL." : "Give it a name and a URL."}</p>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Workspace name</label>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Product Team"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Workspace URL</label>
                  <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 transition-all duration-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <span className="bg-slate-50 px-3 py-2.5 text-sm text-gray-400">/</span>
                    <input
                      className="w-full py-2.5 pr-3.5 text-sm text-gray-800 outline-none"
                      placeholder="product-team"
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(e.target.value);
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? "Saving…" : editTarget ? "Save changes" : "Create workspace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}