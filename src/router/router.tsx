import { lazy } from "react";

export const Auth = lazy(() => import("../pages/Auth/Auth"));
export const Workspace = lazy(() => import("../pages/Workspace/Workspace"));
export const Projects = lazy(() => import("../pages/Projects/Projects"));
export const States = lazy(() => import("../pages/States/States"));
export const Labels = lazy(() => import("../pages/Labels/Labels"));
export const Issues = lazy(() => import("../pages/Issues/Issues"));
export const Comments = lazy(() => import("../pages/Comments/Comments"));
export const Cycles = lazy(() => import("../pages/Cycles/Cycles"));
export const Modules = lazy(() => import("../pages/Modules/Modules"));
export const IssueRelations = lazy(() => import("../pages/IssueRelations/IssueRelations"));
export const Activity = lazy(() => import("../pages/Activity/Activity"));
export const Attachments = lazy(() => import("../pages/Attachments/Attachments"));
export const Notifications = lazy(() => import("../pages/Notifications/Notifications"));

// New UI (friend's shell) + social features
export const Overview = lazy(() => import("../pages/Overview/Overview"));
export const WorkItems = lazy(() => import("../pages/WorkItems/WorkItems"));
export const Views = lazy(() => import("../pages/Views/Views"));
export const Pages = lazy(() => import("../pages/Pages/Pages"));
export const Settings = lazy(() => import("../pages/Settings/Settings"));
export const Preferences = lazy(() => import("../pages/Preferences/Preferences"));
export const Friends = lazy(() => import("../pages/Friends/Friends"));
export const Messages = lazy(() => import("../pages/Messages/Messages"));
export const ChangeRequests = lazy(() => import("../pages/ChangeRequests/ChangeRequests"));
export const Members = lazy(() => import("../pages/Members/Members"));
export const Invitations = lazy(() => import("../pages/Invitations/Invitations"));
export const AccessRequests = lazy(() => import("../pages/AccessRequests/AccessRequests"));
