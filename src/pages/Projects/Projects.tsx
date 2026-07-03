import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Briefcase, Plus, Trash2, Pencil, Search, ChevronDown, Check,
  SlidersHorizontal, X, Loader2, FolderKanban, User2, FolderPlus,
} from "lucide-react";
import { useProjectsStore, type Project } from "./ProjectsZustand";

type ProjectFormValues = {
  name: string;
  identifier: string;
  description: string;
};

type SortMode = "all" | "newest" | "oldest";

const COVERS = [
  "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
  "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=600&q=80",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80",
  "https://images.unsplash.com/photo-1518655048521-f130df041f66?w=600&q=80",
  "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=600&q=80",
];

const STICKERS = ["🎯", "🛠️", "📦", "💡", "🔥", "📊", "🌱", "⚡", "🧩"];

function hashStr(v: string) {
  let h = 0;
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) >>> 0;
  return h;
}
function pick<T>(arr: T[], seed: string) {
  return arr[hashStr(seed) % arr.length];
}

const MODAL_PHOTO = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80";

export default function Projects() {
  const { workspaceSlug = "" } = useParams();
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } =
    useProjectsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("all");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({ defaultValues: { name: "", identifier: "", description: "" } });

  const watchedName = watch("name");

  useEffect(() => {
    void fetchProjects(workspaceSlug);
  }, [fetchProjects, workspaceSlug]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: "", identifier: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditTarget(p);
    reset({ name: p.name, identifier: p.identifier, description: p.description ?? "" });
    setModalOpen(true);
  };

  const onNameChange = (v: string) => {
    if (editTarget) return;
    const auto = v
      .replace(/[^a-zA-Z ]/g, "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
    if (auto) setValue("identifier", auto);
  };

  const onSubmit = async (values: ProjectFormValues) => {
    setSaving(true);
    try {
      const ok = editTarget
        ? await updateProject(workspaceSlug, editTarget.id, {
            name: values.name,
            description: values.description || undefined,
          })
        : await createProject(workspaceSlug, { name: values.name, identifier: values.identifier });
      if (ok) setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p: Project) => {
    setDeletingId(p.id);
    try {
      await deleteProject(workspaceSlug, p.id);
    } finally {
      setDeletingId(null);
    }
  };

  const visibleProjects = useMemo(() => {
    let list = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.identifier.toLowerCase().includes(query.toLowerCase()),
    );
    if (sortMode !== "all") {
      list = [...list].sort((a, b) => {
        const da = new Date((a as any).createdAt ?? 0).getTime();
        const db = new Date((b as any).createdAt ?? 0).getTime();
        return sortMode === "newest" ? db - da : da - db;
      });
    }
    return list;
  }, [projects, query, sortMode]);

  const sortLabel = sortMode === "all" ? "All projects" : sortMode === "newest" ? "Newest first" : "Oldest first";

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes pjFadeUp { from { opacity:0; transform: translateY(10px) scale(0.98);} to { opacity:1; transform: translateY(0) scale(1);} }
        @keyframes pjShimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }
        @keyframes pjScaleIn { from { opacity:0; transform: scale(0.94) translateY(8px);} to { opacity:1; transform: scale(1) translateY(0);} }
        @keyframes pjFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pjPop { from { opacity:0; transform: scale(0.9) translateY(-4px);} to { opacity:1; transform: scale(1) translateY(0);} }
        .pj-card { animation: pjFadeUp .5s cubic-bezier(0.22,1,0.36,1) both; }
        .pj-skel { background-image: linear-gradient(90deg,#f1f5f9 0px,#f8fafc 40px,#f1f5f9 80px); background-size: 600px 100%; animation: pjShimmer 1.4s ease-in-out infinite; }
        .pj-backdrop { animation: pjFadeIn .25s ease both; }
        .pj-modal { animation: pjScaleIn .35s cubic-bezier(0.22,1,0.36,1) both; }
        .pj-pop { animation: pjPop .18s cubic-bezier(0.22,1,0.36,1) both; }
        .pj-search-input { transition: width .3s cubic-bezier(0.22,1,0.36,1), opacity .2s ease; }
      `}</style>

      {/* ---------- HEADER ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <Briefcase size={18} className="text-gray-500" />
          <h1 className="text-lg font-semibold text-gray-800">Projects</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {searchOpen && (
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Search projects…"
                className="pj-search-input mr-1 w-40 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 sm:w-52"
              />
            )}
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <Search size={16} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setSortOpen((s) => !s)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              {sortLabel}
              <ChevronDown size={14} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="pj-pop absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {([
                    ["all", "All projects"],
                    ["newest", "Newest first"],
                    ["oldest", "Oldest first"],
                  ] as [SortMode, string][]).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSortMode(mode);
                        setSortOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      {label}
                      {sortMode === mode && <Check size={14} className="text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
            <SlidersHorizontal size={14} /> Filters
          </button>

          <button
            onClick={openCreate}
            className="group flex items-center gap-1.5 rounded-lg bg-[#131a2e] px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <Plus size={15} className="transition-transform duration-300 group-hover:rotate-90" />
            Add Project
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {/* ---------- GRID ---------- */}
      {projects.length === 0 && loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="pj-skel h-28 w-full" />
              <div className="space-y-2 p-4">
                <div className="pj-skel h-3.5 w-2/3 rounded" />
                <div className="pj-skel h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-white shadow-sm">
            <FolderKanban size={24} />
          </div>
          <p className="font-medium text-gray-700">{query ? "No projects match your search" : "No projects yet"}</p>
          <p className="max-w-xs text-sm text-gray-400">
            {query ? "Try a different name or identifier." : "Create your first project to start tracking issues and cycles."}
          </p>
          {!query && (
            <button
              onClick={openCreate}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#131a2e] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Plus size={15} /> Add Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((p, i) => {
            const cover = pick(COVERS, p.id);
            const sticker = pick(STICKERS, p.identifier || p.id);
            return (
              <div
                key={p.id}
                className={`pj-card group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200/70 hover:shadow-lg hover:shadow-emerald-900/5 ${
                  deletingId === p.id ? "pointer-events-none opacity-40" : ""
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative h-28 w-full overflow-hidden">
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-lg bg-white/90 p-1.5 text-gray-500 backdrop-blur-sm transition-colors hover:text-emerald-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="rounded-lg bg-white/90 p-1.5 text-gray-500 backdrop-blur-sm transition-colors hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="absolute -bottom-5 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-xl shadow-md">
                    {sticker}
                  </div>
                </div>

                <Link to={`/w/${workspaceSlug}/projects/${p.id}/issues`} className="block px-4 pb-4 pt-8">
                  <p className="truncate font-semibold text-gray-800">{p.name}</p>
                  <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium tracking-wide text-gray-500">
                    {p.identifier}
                  </span>

                  {p.description && <p className="mt-2 truncate text-xs text-gray-400">{p.description}</p>}

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <User2 size={13} /> No lead
                  </div>
                </Link>

                <div className="border-t border-gray-100 px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                </div>
              </div>
            );
          })}

          <button
            onClick={openCreate}
            className="pj-card flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:text-emerald-600"
            style={{ animationDelay: `${visibleProjects.length * 50}ms` }}
          >
            <FolderPlus size={20} />
            New project
          </button>
        </div>
      )}

      {/* ---------- MODAL ---------- */}
      {modalOpen && (
        <div
          className="pj-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/60 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="pj-modal grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative hidden md:block">
              <img src={MODAL_PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131a2e]/95 via-[#131a2e]/50 to-emerald-900/30" />
              <div className="relative flex h-full flex-col justify-between p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <FolderKanban size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editTarget ? "Fine-tune this project" : "Start a new project"}
                  </h3>
                  <p className="mt-2 text-sm text-white/75">
                    Give your team a dedicated space to track issues, cycles, and progress.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-6 sm:p-8">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-xl">
                  {watchedName?.trim() ? pick(STICKERS, watchedName) : <FolderKanban size={20} className="text-white" />}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{editTarget ? "Edit project" : "Create project"}</h2>
                  <p className="text-xs text-gray-400">{editTarget ? "Update the details." : "Name it and give it an ID."}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Project name</label>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Mobile App"
                    {...register("name", { required: true, onChange: (e) => onNameChange(e.target.value) })}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">Project name is required.</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Identifier</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase tracking-wide text-gray-800 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="MOB"
                    maxLength={6}
                    disabled={!!editTarget}
                    {...register("identifier", {
                      required: true,
                      onChange: (e) => setValue("identifier", e.target.value.toUpperCase()),
                    })}
                  />
                  {errors.identifier && <p className="mt-1 text-xs text-red-500">Identifier is required.</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Description (optional)</label>
                  <textarea
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="What's this project about?"
                    {...register("description")}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? "Saving…" : editTarget ? "Save changes" : "Create project"}
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