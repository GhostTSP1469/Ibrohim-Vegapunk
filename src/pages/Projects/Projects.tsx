import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Trash2, Pencil, Users, X, UserPlus, Check } from "lucide-react";
import { useProjectsStore, type Project, type LookedUpUser } from "./ProjectsZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

export default function Projects() {
  const { workspaceSlug = "" } = useParams();
  const {
    projects, members, loading, error,
    fetchProjects, createProject, updateProject, deleteProject,
    fetchMembers, addMember, removeMember, lookupByEmail,
  } = useProjectsStore();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");

  // Members modal state
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<LookedUpUser | null>(null);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchProjects(workspaceSlug);
  }, [fetchProjects, workspaceSlug]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createProject(workspaceSlug, { name, identifier })) { setName(""); setIdentifier(""); }
  };
  const startEdit = (p: Project) => { setEditId(p.id); setEName(p.name); setEDesc(p.description ?? ""); };
  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateProject(workspaceSlug, id, { name: eName, description: eDesc || undefined })) setEditId(null);
  };

  const openMembers = (p: Project) => {
    setModalProject(p);
    setEmail(""); setFound(null); setLookupMsg(null);
    void fetchMembers(workspaceSlug, p.id);
  };
  const onLookup = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setFound(null); setLookupMsg(null);
    const u = await lookupByEmail(email.trim());
    setBusy(false);
    if (u) setFound(u);
    else setLookupMsg("No user found with that email.");
  };
  const onAddFound = async () => {
    if (!found || !modalProject) return;
    if (await addMember(workspaceSlug, modalProject.id, { user_id: found.id })) {
      setFound(null); setEmail(""); setLookupMsg(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Projects" count={projects.length} subtitle="Everything the team is building." />
      <ErrorBanner error={error} />

      <form onSubmit={onCreate} className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
        <input className={field + " flex-1"} placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={field + " w-32"} placeholder="ID (MOB)" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <button className={primaryBtn} disabled={loading}><Plus size={16} /> Create</button>
      </form>

      {projects.length === 0 && !loading ? (
        <EmptyState icon={<Users size={28} />} text="No projects yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) =>
            editId === p.id ? (
              <form key={p.id} onSubmit={(e) => onSaveEdit(e, p.id)} className={`space-y-2 p-4 ${card}`}>
                <input className={field} value={eName} onChange={(e) => setEName(e.target.value)} required />
                <input className={field} placeholder="Description" value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
                <div className="flex gap-2">
                  <button className={primaryBtn} disabled={loading}>Save</button>
                  <button type="button" onClick={() => setEditId(null)} className={ghostBtn}>Cancel</button>
                </div>
              </form>
            ) : (
              <div key={p.id} className={`group relative p-4 transition hover:-translate-y-0.5 hover:shadow-md ${card}`}>
                <Link to={`/w/${workspaceSlug}/projects/${p.id}/issues`} className="block">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">{p.identifier}</span>
                  </div>
                  <p className="truncate font-semibold text-gray-800">{p.name}</p>
                  {p.description && <p className="mt-1 truncate text-xs text-gray-400">{p.description}</p>}
                </Link>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openMembers(p)} title="Members" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"><Users size={15} /></button>
                  <button onClick={() => startEdit(p)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"><Pencil size={15} /></button>
                  <button onClick={() => deleteProject(workspaceSlug, p.id)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Members modal */}
      {modalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setModalProject(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Members · {modalProject.name}</h2>
              <button onClick={() => setModalProject(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            {/* Add by email */}
            <form onSubmit={onLookup} className="flex items-center gap-2">
              <input className={field + " flex-1"} type="email" placeholder="Add member by email…" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button className={primaryBtn} disabled={busy}>{busy ? "…" : "Find"}</button>
            </form>

            {found && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="text-sm text-emerald-800">
                  User <b>{found.display_name}</b> found
                </span>
                <button onClick={onAddFound} className={primaryBtn + " bg-emerald-600 hover:bg-emerald-700"}><UserPlus size={15} /> Add</button>
              </div>
            )}
            {lookupMsg && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{lookupMsg}</p>}

            {/* Current members */}
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Current members</p>
              <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-100">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {m.user.display_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-800">{m.user.display_name}</span>
                      <span className="rounded bg-gray-100 px-1.5 text-[11px] text-gray-500">{m.role}</span>
                    </span>
                    <button onClick={() => removeMember(workspaceSlug, modalProject.id, m.user_id)} className="rounded p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </li>
                ))}
                {members.length === 0 && <li className="px-3 py-3 text-sm text-gray-400">No members yet.</li>}
              </ul>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setModalProject(null)} className={ghostBtn}><Check size={15} /> Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
