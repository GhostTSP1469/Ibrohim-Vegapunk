import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Bell, UserPlus, MessageSquare, AtSign, CheckCheck } from "lucide-react";
import { useNotificationsStore, type Notification, type NotificationType } from "./NotificationsZustand";
import { PageHeader, EmptyState, ErrorBanner, ghostBtn, card } from "../../components/ui/kit";

const META: Record<NotificationType, { icon: typeof Bell; text: string; className: string }> = {
  issue_assigned: { icon: UserPlus, text: "assigned you to an issue", className: "text-brand-600 bg-brand-50" },
  comment_added: { icon: MessageSquare, text: "commented on an issue", className: "text-emerald-600 bg-emerald-50" },
  mentioned: { icon: AtSign, text: "mentioned you", className: "text-amber-600 bg-amber-50" },
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notifications() {
  const { workspaceSlug = "" } = useParams();
  const { notifications, unreadCount, loading, error, fetchNotifications, markAllRead, markRead } = useNotificationsStore();

  useEffect(() => {
    void fetchNotifications(workspaceSlug);
    const t = setInterval(() => void fetchNotifications(workspaceSlug), 10000);
    return () => clearInterval(t);
  }, [fetchNotifications, workspaceSlug]);

  const row = (n: Notification) => {
    const meta = META[n.type] ?? { icon: Bell, text: n.type, className: "text-gray-500 bg-gray-100" };
    const Icon = meta.icon;
    return (
      <button
        key={n.id}
        onClick={() => !n.is_read && markRead(workspaceSlug, n.id)}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${n.is_read ? "" : "bg-brand-50/50"}`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-sm text-gray-800">
            <b>{n.actor?.display_name ?? "Someone"}</b> {meta.text}
          </span>
          <span className="mt-0.5 block text-xs text-gray-400">{timeAgo(n.created_at)}</span>
        </span>
        {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        count={unreadCount}
        subtitle="Activity that involves you in this workspace."
        action={
          unreadCount > 0 ? (
            <button onClick={() => markAllRead(workspaceSlug)} className={ghostBtn}>
              <CheckCheck size={15} /> Mark all read
            </button>
          ) : undefined
        }
      />
      <ErrorBanner error={error} />

      {notifications.length === 0 && !loading ? (
        <EmptyState icon={<Bell size={28} />} text="No notifications yet. You'll be notified when someone assigns, comments or mentions you." />
      ) : (
        <div className={`divide-y divide-gray-100 ${card}`}>{notifications.map(row)}</div>
      )}
    </div>
  );
}
