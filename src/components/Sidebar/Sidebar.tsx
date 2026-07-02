import { NavLink, useParams } from "react-router-dom";
import {
  LayoutGrid,
  Bell,
  FolderKanban,
  CircleDashed,
  Tag,
  RefreshCw,
  Boxes,
  MessageSquare,
  GitBranch,
  Activity as ActivityIcon,
  Paperclip,
  Layers,
} from "lucide-react";
import type { ComponentType } from "react";

const itemBase =
  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors";
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${itemBase} ${isActive ? "bg-brand-50 font-medium text-brand-700" : "text-gray-600 hover:bg-gray-100"}`;

function Section({ label }: { label: string }) {
  return (
    <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {label}
    </div>
  );
}

function Item({ to, icon: Icon, label, end }: { to: string; icon: ComponentType<{ size?: number }>; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={linkClass}>
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { workspaceSlug, projectId, issueId } = useParams();
  const p = `/w/${workspaceSlug}/projects/${projectId}`;
  const i = `${p}/issues/${issueId}`;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Layers size={18} />
        </div>
        <span className="font-semibold text-gray-800">Taskly</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        <Item to="/" end icon={LayoutGrid} label="Workspaces" />

        {workspaceSlug && (
          <>
            <Section label="Workspace" />
            <Item to={`/w/${workspaceSlug}/projects`} icon={FolderKanban} label="Projects" />
            <Item to={`/w/${workspaceSlug}/notifications`} icon={Bell} label="Notifications" />
          </>
        )}

        {workspaceSlug && projectId && (
          <>
            <Section label="Project" />
            <Item to={`${p}/issues`} icon={CircleDashed} label="Issues" />
            <Item to={`${p}/states`} icon={Layers} label="States" />
            <Item to={`${p}/labels`} icon={Tag} label="Labels" />
            <Item to={`${p}/cycles`} icon={RefreshCw} label="Cycles" />
            <Item to={`${p}/modules`} icon={Boxes} label="Modules" />
          </>
        )}

        {workspaceSlug && projectId && issueId && (
          <>
            <Section label="Issue" />
            <Item to={`${i}/comments`} icon={MessageSquare} label="Comments" />
            <Item to={`${i}/relations`} icon={GitBranch} label="Relations" />
            <Item to={`${i}/activity`} icon={ActivityIcon} label="Activity" />
            <Item to={`${i}/attachments`} icon={Paperclip} label="Attachments" />
          </>
        )}
      </nav>
    </aside>
  );
}
