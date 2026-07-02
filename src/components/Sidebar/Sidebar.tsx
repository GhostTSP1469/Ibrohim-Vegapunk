import { useState } from "react";
import {
  Boxes,
  Component,
  Sparkles,
  Settings,
  SquarePen,
  Home,
  Pencil,
  UserPlus,
  StickyNote,
  ChevronDown,
  Briefcase,
  MoreHorizontal,
  Flag,
  SlidersHorizontal,
  PanelLeft,
} from "lucide-react";

const railItems = [
  { icon: Boxes, label: "Projects", active: true },
  { icon: Component, label: "Wiki", active: false },
  { icon: Sparkles, label: "AI", active: false },
];

const topNav = [
  { icon: Home, label: "Home", active: true },
  { icon: Pencil, label: "Drafts", active: false },
  { icon: UserPlus, label: "Your work", active: false },
  { icon: StickyNote, label: "Stickies", active: false },
];

export default function Sidebar() {
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="flex h-screen bg-white font-sans text-[15px] text-gray-800">
      {/* Icon rail */}
      <div className="relative flex w-16 flex-shrink-0 flex-col items-center justify-between border-r border-gray-100 py-4">
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-700"
          >
            <PanelLeft size={14} />
          </button>
        )}

        <div className="flex flex-col items-center gap-1">
          {railItems.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className="group flex flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-700"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
              </div>
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        <button className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-gray-400 transition-colors hover:text-gray-700">
          <Settings size={18} />
          <span className="text-[11px] font-medium">Settings</span>
        </button>
      </div>

      {/* Collapsible panel */}
      <div
        className="overflow-hidden border-r border-gray-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: panelOpen ? "288px" : "0px" }}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4">
            <span className="text-[15px] font-semibold text-gray-900">
              Projects
            </span>
            <div className="flex items-center gap-1 text-gray-400">
              <button className="rounded-md p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-700">
                <SlidersHorizontal size={16} />
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-md p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <PanelLeft size={16} />
              </button>
            </div>
          </div>

          {/* New work item */}
          <div className="px-4 pt-3">
            <button className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50">
              <SquarePen size={16} />
              <span className="text-[14px]">New work item</span>
            </button>
          </div>

          {/* Top nav */}
          <div className="flex flex-col gap-0.5 px-2 pt-3">
            {topNav.map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                <span className="text-[14px] font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex-1 overflow-y-auto px-2">
            {/* Workspace accordion */}
            <AccordionSection
              title="Workspace"
              open={workspaceOpen}
              onToggle={() => setWorkspaceOpen((v) => !v)}
            >
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-gray-600 transition-colors hover:bg-gray-50">
                <Briefcase size={16} />
                <span className="text-[14px] font-medium">Projects</span>
              </button>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-gray-600 transition-colors hover:bg-gray-50">
                <MoreHorizontal size={16} />
                <span className="text-[14px] font-medium">More</span>
              </button>
            </AccordionSection>

            {/* Projects accordion */}
            <AccordionSection
              title="Projects"
              open={projectsOpen}
              onToggle={() => setProjectsOpen((v) => !v)}
            >
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-gray-600 transition-colors hover:bg-gray-50">
                <span className="flex items-center gap-2.5">
                  <Flag size={16} className="fill-yellow-400 text-yellow-500" />
                  <span className="text-[14px] font-medium">Ghost1469</span>
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>
            </AccordionSection>
          </div>

          {/* Trial banner */}
          <div className="border-t border-gray-100 p-3">
            <button className="w-full rounded-lg bg-gray-50 px-3 py-2 text-center text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-100">
              Business trial ends in 12d
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccordionSection({
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
        className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-gray-50"
      >
        <span className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      <div
        className="grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 pt-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
