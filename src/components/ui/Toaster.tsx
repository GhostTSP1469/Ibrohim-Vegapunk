import { useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useToastStore } from "./toast";
import { useNotificationsStore } from "../../pages/Notifications/NotificationsZustand";
import { useMessagesStore } from "../../pages/Messages/MessagesZustand";
import { useInvitesStore } from "../../pages/Invitations/InvitesZustand";

/** Renders the stacked toast alerts (bottom-right). */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Bell size={16} />
          </span>
          <span className="text-sm text-gray-800">{t.text}</span>
          <button onClick={() => dismiss(t.id)} className="ml-1 text-gray-300 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Watches global counters (notifications / messages / invitations) and pops a
 * self-made alert whenever one increases. Polls the global sources so alerts
 * fire anywhere in the app.
 */
export function AlertWatcher() {
  const push = useToastStore((s) => s.push);
  const notifUnread = useNotificationsStore((s) => s.unreadCount);
  const conversations = useMessagesStore((s) => s.conversations);
  const invites = useInvitesStore((s) => s.invites);
  const fetchConversations = useMessagesStore((s) => s.fetchConversations);
  const fetchInvites = useInvitesStore((s) => s.fetchInvites);

  const msgUnread = conversations.reduce((n, c) => n + (c.unread_count || 0), 0);
  const inviteCount = invites.length;

  useEffect(() => {
    void fetchConversations();
    void fetchInvites();
    const t = setInterval(() => {
      void fetchConversations();
      void fetchInvites();
    }, 12000);
    return () => clearInterval(t);
  }, [fetchConversations, fetchInvites]);

  // -1 = not yet initialised, so the first values never trigger a toast.
  const prev = useRef({ notif: -1, msg: -1, inv: -1 });
  useEffect(() => {
    const p = prev.current;
    if (p.notif >= 0 && notifUnread > p.notif) push(`You have ${plural(notifUnread, "unread notification")}`);
    if (p.msg >= 0 && msgUnread > p.msg) push(`You have ${plural(msgUnread, "unread message")}`);
    if (p.inv >= 0 && inviteCount > p.inv) push(`You have ${plural(inviteCount, "new invitation")}`);
    prev.current = { notif: notifUnread, msg: msgUnread, inv: inviteCount };
  }, [notifUnread, msgUnread, inviteCount, push]);

  return null;
}
