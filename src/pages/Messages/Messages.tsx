import { useEffect, useState, type FormEvent } from "react";
import { Send, MessagesSquare } from "lucide-react";
import { useMessagesStore, type Conversation } from "./MessagesZustand";
import { useAuthStore } from "../Auth/AuthZustand";
import { PageHeader, ErrorBanner, card } from "../../components/ui/kit";

export default function Messages() {
  const me = useAuthStore((s) => s.user?.id);
  const { conversations, activeId, messages, loading, error, fetchConversations, setActive, fetchMessages, sendMessage, markRead } = useMessagesStore();
  const [body, setBody] = useState("");

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  const otherOf = (c: Conversation) => (c.user_a.id === me ? c.user_b : c.user_a);
  const active = conversations.find((c) => c.id === activeId);

  const openConv = async (c: Conversation) => {
    setActive(c.id);
    await fetchMessages(c.id);
    if (c.unread_count > 0) await markRead(c.id);
  };
  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !body.trim()) return;
    if (await sendMessage(activeId, body)) setBody("");
  };

  const avatar = (name: string, url: string | null) =>
    url ?? `https://placehold.co/72x72/eef4ff/3f76ff?text=${name.charAt(0).toUpperCase()}`;

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" subtitle="Chat with your connections." />
      <ErrorBanner error={error} />

      <div className={`flex h-135 overflow-hidden ${card}`}>
        {/* Conversation list */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-gray-100">
          {conversations.map((c) => {
            const u = otherOf(c);
            return (
              <button
                key={c.id}
                onClick={() => openConv(c)}
                className={`flex w-full items-center gap-2.5 border-b border-gray-50 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${activeId === c.id ? "bg-brand-50" : ""}`}
              >
                <img src={avatar(u.display_name, u.avatar_url)} alt="" className="h-9 w-9 rounded-full border border-gray-200 object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-gray-800">{u.display_name}</span>
                    {c.unread_count > 0 && <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">{c.unread_count}</span>}
                  </span>
                  <span className="truncate text-xs text-gray-400">{c.last_message?.body ?? "No messages yet"}</span>
                </span>
              </button>
            );
          })}
          {!loading && conversations.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No conversations. Start one from Friends → Message.</p>
          )}
        </div>

        {/* Active chat */}
        <div className="flex flex-1 flex-col bg-gray-50/40">
          {active ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-gray-100 bg-white px-4 py-2.5">
                <img src={avatar(otherOf(active).display_name, otherOf(active).avatar_url)} alt="" className="h-8 w-8 rounded-full border border-gray-200 object-cover" />
                <span className="text-sm font-semibold text-gray-800">{otherOf(active).display_name}</span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
                {messages.map((m) => {
                  const mine = m.sender_id === me;
                  return (
                    <div key={m.id} className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? "self-end bg-brand-600 text-white" : "self-start bg-white text-gray-800"}`}>
                      {m.body}
                    </div>
                  );
                })}
                {messages.length === 0 && <p className="m-auto text-sm text-gray-400">No messages yet — say hi 👋</p>}
              </div>
              <form onSubmit={onSend} className="flex items-center gap-2 border-t border-gray-100 bg-white p-3">
                <input className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white" placeholder="Type a message…" value={body} onChange={(e) => setBody(e.target.value)} />
                <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50" disabled={!body.trim()}>
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
    </div>
  );
}
