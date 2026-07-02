import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNotificationsStore } from "./NotificationsZustand";

export default function Notifications() {
  const { workspaceSlug = "" } = useParams();
  const { notifications, loading, error, fetchNotifications, markAllRead, markRead } =
    useNotificationsStore();

  useEffect(() => {
    void fetchNotifications(workspaceSlug);
  }, [fetchNotifications, workspaceSlug]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <button
          onClick={() => markAllRead(workspaceSlug)}
          className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
        >
          Mark all read
        </button>
      </div>
      {error && <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
              n.is_read ? "bg-white" : "bg-brand-50"
            }`}
          >
            <span className="text-sm text-gray-700">
              {n.type}
              {n.entity_type ? ` · ${n.entity_type}` : ""}
            </span>
            {!n.is_read && (
              <button onClick={() => markRead(workspaceSlug, n.id)} className="text-sm text-brand-600 hover:underline">
                Read
              </button>
            )}
          </li>
        ))}
        {!loading && notifications.length === 0 && <li className="text-gray-400">No notifications.</li>}
      </ul>
    </div>
  );
}
