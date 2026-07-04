import { create } from "zustand";
import type { Issue } from "./IssuesZustand";

interface DrawerState {
  slug: string;
  projectId: string;
  issue: Issue | null;
  open: (slug: string, projectId: string, issue: Issue) => void;
  close: () => void;
}

// Lightweight global store so any view (list/board/table/spreadsheet) can pop the
// issue detail drawer without threading props through the big Issues component.
export const useIssueDrawer = create<DrawerState>((set) => ({
  slug: "",
  projectId: "",
  issue: null,
  open: (slug, projectId, issue) => set({ slug, projectId, issue }),
  close: () => set({ issue: null }),
}));
