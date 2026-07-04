import { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import {
  Boxes,
  Component,
  Sparkles,
  Settings,
  Home,
  Users,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Briefcase,
  PanelLeft,
  LayoutDashboard,
  FileText,
  Circle,
  Tag,
  RefreshCw,
  Layers,
  Bell,
  Eye,
  StickyNote,
  Mail,
  UserCog,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceStore } from "../../pages/Workspace/WorkspaceZustand";
import { useProjectsStore } from "../../pages/Projects/ProjectsZustand";
import { useNotificationsStore } from "../../pages/Notifications/NotificationsZustand";
import { useInvitesStore } from "../../pages/Invitations/InvitesZustand";

const railItems = [
  {icon: Boxes, label: "Projects", to: "/",},
  {icon: Component,label: "Wiki",to: "/wiki",},
  {icon: Sparkles,label: "AI",to: "/ai",},
];

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
  }`;

const fileCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    isActive ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
  }`;

function projectFiles(slug: string, pid: string): { icon: LucideIcon; label: string; to: string }[] {
  const base = `/w/${slug}/projects/${pid}`;
  return [
    { icon: LayoutDashboard, label: "Overview", to: `${base}/overview` },
    { icon: FileText, label: "Issues", to: `${base}/issues` },
    { icon: Circle, label: "States", to: `${base}/states` },
    { icon: Tag, label: "Labels", to: `${base}/labels` },
    { icon: RefreshCw, label: "Cycles", to: `${base}/cycles` },
    { icon: Layers, label: "Modules", to: `${base}/modules` },
    { icon: Eye, label: "Views", to: `${base}/views` },
    { icon: StickyNote, label: "Pages", to: `${base}/pages` },
  ];
}

export default function Sidebar() {
  const { workspaceSlug = "", projectId = "" } = useParams();
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { unreadCount, fetchNotifications } = useNotificationsStore();
  const inviteCount = useInvitesStore((s) => s.invites.length);

  const [panelOpen, setPanelOpen] = useState(true);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (workspaceSlug) void fetchProjects(workspaceSlug);
  }, [workspaceSlug, fetchProjects]);

  useEffect(() => {
    if (!workspaceSlug) return;
    void fetchNotifications(workspaceSlug);
    const t = setInterval(() => void fetchNotifications(workspaceSlug), 15000);
    return () => clearInterval(t);
  }, [workspaceSlug, fetchNotifications]);

  // Auto-expand the folder of the project in the URL — React's "adjust state
  // during render" pattern (track previous value in state, no effect/ref).
  const [prevProjectId, setPrevProjectId] = useState("");
  if (projectId && projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setOpenFolder(projectId);
  }

  return (
    <div className="flex h-full bg-white font-sans text-[15px] text-gray-800 ">
      {/* ── Icon rail ── */}
      <div className="relative flex w-16 shrink-0 flex-col items-center justify-between border-r border-gray-100 py-4">
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 shadow-sm hover:text-gray-700"
          >
            <PanelLeft size={14} />
          </button>
        )}
        <div className="flex flex-col items-center gap-1">
         {railItems.map(({ icon: Icon, label, to }) => (
  <NavLink
    key={label}
    to={to}
    className="flex flex-col items-center gap-1 px-2 py-2"
  >
    {({ isActive }) => (
      <>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isActive
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-400"
          }`}
        >
          <Icon size={17} strokeWidth={2} />
        </div>

        <span
          className={`text-[11px] font-medium ${
            isActive ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {label}
        </span>
      </>
    )}
  </NavLink>
))}
        </div>
        <Link to="/settings" className="flex flex-col items-center gap-1 px-2 py-2 text-gray-400 hover:text-gray-700">
          <Settings size={18} />
          <span className="text-[11px] font-medium">Settings</span>
        </Link>
      </div>

      {/* ── Collapsible panel ── */}
      <div
        className="overflow-hidden border-r border-gray-100 transition-all duration-300"
        style={{ width: panelOpen ? "272px" : "0px" }}
      >
        <div className="flex h-full w-68 flex-col ">
          <div className="flex items-center justify-between px-4 pt-4">
            <span className="text-[15px] font-semibold text-gray-900">Workspace</span>
            <button onClick={() => setPanelOpen(false)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <PanelLeft size={16} />
            </button>
          </div>

          {/* Top nav (global) */}
          <div className="flex flex-col gap-0.5 px-2 pt-3">
            <NavLink to="/" end className={linkCls}>
              <Home size={16} /> <span>Workspaces</span>
            </NavLink>
            <NavLink to="/friends" className={linkCls}>
              <Users size={16} /> <span>Friends</span>
            </NavLink>
            <NavLink to="/messages" className={linkCls}>
              <MessageSquare size={16} /> <span>Messages</span>
            </NavLink>
            <NavLink to="/invitations" className={linkCls}>
              <Mail size={16} /> <span>Invitations</span>
              {inviteCount > 0 && (
                <span className="ml-auto rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">{inviteCount}</span>
              )}
            </NavLink>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto px-2">
            {/* Workspaces */}
            <Accordion title="Workspaces" open={workspaceOpen} onToggle={() => setWorkspaceOpen((v) => !v)}>
              {workspaces.map((w) => (
                <NavLink key={w.id} to={`/w/${w.slug}/projects`} className={linkCls}>
                  <Briefcase size={16} />
                  <span className="truncate">{w.name}</span>
                </NavLink>
              ))}
              {workspaces.length === 0 && <p className="px-3 py-1 text-[13px] text-gray-400">No workspaces</p>}
            </Accordion>

            {/* Projects of the active workspace */}
            {workspaceSlug && (
              <Accordion title="Projects" open={projectsOpen} onToggle={() => setProjectsOpen((v) => !v)}>
                <NavLink to={`/w/${workspaceSlug}/notifications`} className={linkCls}>
                  <Bell size={16} /> <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">{unreadCount}</span>
                  )}
                </NavLink>
                <NavLink to={`/w/${workspaceSlug}/members`} className={linkCls}>
                  <UserCog size={16} /> <span>Members</span>
                </NavLink>
                <NavLink to={`/w/${workspaceSlug}/requests`} className={linkCls}>
                  <ShieldCheck size={16} /> <span>Requests</span>
                </NavLink>
                <NavLink to={`/w/${workspaceSlug}/settings`} className={linkCls}>
                  <Settings size={16} /> <span>Settings</span>
                </NavLink>
                {projects.map((p) => {
                  const isOpen = openFolder === p.id;
                  return (
                    <div key={p.id}>
                      <button
                        onClick={() => setOpenFolder(isOpen ? null : p.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-gray-600 hover:bg-gray-50"
                      >
                        <ChevronRight size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        {isOpen ? <FolderOpen size={16} className="text-yellow-500" /> : <Folder size={16} className="text-yellow-500" />}
                        <span className="truncate text-[14px] font-medium">{p.name}</span>
                        <span className="ml-auto rounded bg-gray-100 px-1 text-[10px] font-semibold text-gray-500">{p.identifier}</span>
                      </button>
                      {isOpen && (
                        <div className="ml-5 flex flex-col gap-0.5 border-l border-gray-200 pl-2 pt-0.5">
                          {projectFiles(workspaceSlug, p.id).map(({ icon: Icon, label, to }) => (
                            <NavLink key={label} to={to} className={fileCls}>
                              <Icon size={14} strokeWidth={2} /> <span>{label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {projects.length === 0 && <p className="px-3 py-1 text-[13px] text-gray-400">No projects</p>}
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left hover:bg-gray-50"
      >
        <span className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{title}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      {open && <div className="flex flex-col gap-0.5 pt-0.5">{children}</div>}
    </div>
  );
}
