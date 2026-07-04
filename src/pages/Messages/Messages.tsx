import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Send, MessagesSquare, Trash2, Pencil, Check, CheckCheck, X, Loader2 } from "lucide-react";
import { useMessagesStore, type Conversation, type Message } from "./MessagesZustand";
import { useAuthStore } from "../Auth/AuthZustand";
import { PageHeader, ErrorBanner, card } from "../../components/ui/kit";

const POLL_MS = 4000;
const GROUP_GAP_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 120;

function isSameDay(a: string, b: string) {
  const d1 = new Date(a), d2 = new Date(b);
  return d1.toDateString() === d2.toDateString();
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/* =======================
   MODAL SHELL
======================= */
function ModalShell({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Defer to the next frame so the enter/exit transition runs; setting state
    // inside rAF (not synchronously in the effect body) keeps it lint-clean.
    const raf = requestAnimationFrame(() => setShow(open));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-sm transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0"}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 transition-all duration-200 ${show ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
}

/* =======================
   DELETE MODAL
======================= */
function DeleteMessageModal({
  message,
  onClose,
  onConfirm,
}: {
  message: Message | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!message) return;
    setBusy(true);
    await onConfirm(message.id);
    setBusy(false);
  };

  return (
    <ModalShell open={!!message} onClose={busy ? () => {} : onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-gray-900">Delete message?</h3>
        <p className="mt-1 text-sm text-gray-500">
          This can't be undone. The message will be removed for everyone in this conversation.
        </p>

        {message && (
          <div className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-left text-sm text-gray-600">
            <p className="line-clamp-3 wrap-break-word">{message.body}</p>
          </div>
        )}

        <div className="mt-5 flex w-full gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-full border border-gray-200 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-500 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* =======================
   EDIT MODAL
   Local-only: saves instantly, no network round trip, works offline.
======================= */
function EditMessageModal({
  message,
  onClose,
  onSave,
}: {
  message: Message | null;
  onClose: () => void;
  onSave: (id: string, body: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync the editor to the message being edited — React's "adjust state during
  // render" pattern (track previous id in state, so it runs once per message).
  const [prevMsgId, setPrevMsgId] = useState<string | null>(null);
  if (message && message.id !== prevMsgId) {
    setPrevMsgId(message.id);
    setText(message.body);
    setErr(null);
  }

  useEffect(() => {
    if (!message) return;
    const raf = requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [message]);

  const save = async () => {
    if (!message) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setErr("Message can't be empty.");
      return;
    }
    if (trimmed === message.body) {
      onClose();
      return;
    }
    await onSave(message.id, trimmed);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void save();
    }
  };

  return (
    <ModalShell open={!!message} onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Edit message</h3>
        <button onClick={onClose} className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 focus:bg-white"
      />
      {err && <p className="mt-1.5 text-xs text-red-500">{err}</p>}
      <p className="mt-1.5 text-[11px] text-gray-350">
        Saved on this device only — Enter to save, Shift+Enter for a new line.
      </p>

      <div className="mt-4 flex w-full gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-full border border-gray-200 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!text.trim()}
          className="flex-1 rounded-full bg-brand-600 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          Save changes
        </button>
      </div>
    </ModalShell>
  );
}

/* =======================
   MAIN COMPONENT
======================= */
export default function Messages() {
  const me = useAuthStore((s) => s.user?.id);
  const {
    conversations, activeId, messages, loading, error, editedIds,
    fetchConversations, setActive, fetchMessages, sendMessage, markRead,
    deleteMessage, editMessage,
  } = useMessagesStore();

  // Guard: never index into this if the store hasn't hydrated it yet
  // (e.g. mid hot-reload, or an older persisted store shape).
  const edited = editedIds ?? {};

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [editTarget, setEditTarget] = useState<Message | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const wasNearBottom = useRef(true);

  const modalOpen = !!deleteTarget || !!editTarget;

  // Conversation list poll — GET only, nothing else.
  useEffect(() => {
    if (modalOpen) return;
    void fetchConversations();
    const t = setInterval(() => void fetchConversations(), POLL_MS);
    return () => clearInterval(t);
  }, [fetchConversations, modalOpen]);

  // Active conversation messages poll — GET only, nothing else.
  // markRead is never called here; it only runs from openConv, an explicit action.
  useEffect(() => {
    if (!activeId || modalOpen) return;
    const t = setInterval(() => void fetchMessages(activeId), POLL_MS);
    return () => clearInterval(t);
  }, [activeId, fetchMessages, modalOpen]);

  useEffect(() => {
    if (wasNearBottom.current) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const otherOf = (c: Conversation) => (c.user_a.id === me ? c.user_b : c.user_a);
  const active = conversations.find((c) => c.id === activeId);

  const openConv = async (c: Conversation) => {
    setActive(c.id);
    wasNearBottom.current = true;
    await fetchMessages(c.id);
    if (c.unread_count > 0) await markRead(c.id);
  };

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !body.trim() || sending) return;
    setSending(true);
    wasNearBottom.current = true;
    const ok = await sendMessage(activeId, body.trim());
    setSending(false);
    if (ok) setBody("");
  };

  const confirmDelete = async (messageId: string) => {
    if (!activeId) return;
    await deleteMessage(activeId, messageId);
    setDeleteTarget(null);
  };

  const saveEdit = async (messageId: string, newBody: string) => {
    if (!activeId) return false;
    return editMessage(activeId, messageId, newBody);
  };

  const avatar = (name: string, url: string | null) =>
    url ?? `https://placehold.co/72x72/eef4ff/3f76ff?text=${name.charAt(0).toUpperCase()}`;

  const rows = messages.map((m, i) => {
    const prev = messages[i - 1];
    const sameSenderAsPrev = prev && prev.sender_id === m.sender_id;
    const closeToPrev = prev && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_GAP_MS;
    const sameDayAsPrev = prev && isSameDay(prev.created_at, m.created_at);
    const isNewGroup = !(sameSenderAsPrev && closeToPrev && sameDayAsPrev);

    const next = messages[i + 1];
    const sameSenderAsNext = next && next.sender_id === m.sender_id;
    const closeToNext = next && new Date(next.created_at).getTime() - new Date(m.created_at).getTime() < GROUP_GAP_MS;
    const sameDayAsNext = next && isSameDay(m.created_at, next.created_at);
    const isLastInGroup = !(sameSenderAsNext && closeToNext && sameDayAsNext);

    return { message: m, showDateDivider: isNewGroup && !sameDayAsPrev, isNewGroup, isLastInGroup };
  });

  const lastMineId = [...messages].reverse().find((m) => m.sender_id === me)?.id;

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" subtitle="Chat with your connections." />
      <ErrorBanner error={error} />

      <div className={`flex h-135 overflow-hidden ${card}`}>
        {/* Conversation list */}
        <div className="w-64 shrink-0 overflow-y-auto overflow-x-hidden border-r border-gray-100">
          {conversations.map((c) => {
            const u = otherOf(c);
            return (
              <button
                key={c.id}
                onClick={() => openConv(c)}
                className={`flex w-full items-center gap-2.5 border-b border-gray-50 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${activeId === c.id ? "bg-brand-50" : ""}`}
              >
                <img src={avatar(u.display_name, u.avatar_url)} alt="" className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-medium text-gray-800">{u.display_name}</span>
                    {c.last_message_at && (
                      <span className="ml-auto shrink-0 text-[11px] text-gray-350">{timeLabel(c.last_message_at)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="truncate text-xs text-gray-400">{c.last_message?.body ?? "No messages yet"}</span>
                    {c.unread_count > 0 && (
                      <span className="ml-auto shrink-0 rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">{c.unread_count}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {!loading && conversations.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No conversations. Start one from Friends → Message.</p>
          )}
        </div>

        {/* Active chat */}
        <div className="flex min-w-0 flex-1 flex-col bg-gray-50/40">
          {active ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-gray-100 bg-white px-4 py-2.5">
                <img src={avatar(otherOf(active).display_name, otherOf(active).avatar_url)} alt="" className="h-8 w-8 rounded-full border border-gray-200 object-cover" />
                <span className="truncate text-sm font-semibold text-gray-800">{otherOf(active).display_name}</span>
              </div>

              <div ref={scrollRef} onScroll={handleScroll} className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 py-3">
                {rows.map(({ message: m, showDateDivider, isNewGroup, isLastInGroup }) => {
                  const mine = m.sender_id === me;
                  const wasEdited = edited[m.id] !== undefined;

                  return (
                    <div key={m.id}>
                      {showDateDivider && (
                        <div className="my-3 flex items-center gap-2 text-[11px] font-medium text-gray-400">
                          <div className="h-px flex-1 bg-gray-200" />
                          {dateLabel(m.created_at)}
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                      )}

                      <div className={`group flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"} ${isNewGroup ? "mt-3" : "mt-0.5"}`}>
                        {!mine && (
                          <img
                            src={avatar(m.sender.display_name, m.sender.avatar_url)}
                            alt=""
                            className={`h-6 w-6 shrink-0 rounded-full border border-gray-200 object-cover ${isLastInGroup ? "opacity-100" : "opacity-0"}`}
                          />
                        )}

                        {mine && (
                          <div className="mb-1 hidden shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 sm:flex">
                            <button
                              onClick={() => setEditTarget(m)}
                              className="rounded-full p-1 text-gray-350 transition hover:bg-gray-100 hover:text-brand-600"
                              title="Edit message"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(m)}
                              className="rounded-full p-1 text-gray-350 transition hover:bg-gray-100 hover:text-red-500"
                              title="Delete message"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}

                        <div
                          className={`max-w-[70%] wrap-break-word px-3.5 py-2 text-sm shadow-sm ${
                            mine ? "bg-brand-600 text-white" : "bg-white text-gray-800"
                          } ${
                            mine
                              ? isLastInGroup ? "rounded-2xl rounded-br-md" : "rounded-2xl"
                              : isLastInGroup ? "rounded-2xl rounded-bl-md" : "rounded-2xl"
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>

                      {isLastInGroup && (
                        <div className={`mt-0.5 flex items-center gap-1 text-[10.5px] text-gray-350 ${mine ? "justify-end pr-1" : "justify-start pl-8"}`}>
                          {wasEdited && <span className="italic">edited ·</span>}
                          {timeLabel(m.created_at)}
                          {mine && m.id === lastMineId && (m.is_read ? <CheckCheck size={12} className="text-brand-500" /> : <Check size={12} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="m-auto flex flex-col items-center gap-1 text-gray-400">
                    <MessagesSquare size={28} className="text-gray-300" />
                    <p className="text-sm">No messages yet — say hi 👋</p>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={onSend} className="flex items-center gap-2 border-t border-gray-100 bg-white p-3">
                <input
                  className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
                  placeholder="Type a message…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
                  disabled={!body.trim() || sending}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-300">
              <MessagesSquare size={40} />
              <span className="text-sm text-gray-400">Select a conversation</span>
            </div>
          )}
        </div>
      </div>

      <DeleteMessageModal message={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      <EditMessageModal message={editTarget} onClose={() => setEditTarget(null)} onSave={saveEdit} />
    </div>
  );
}