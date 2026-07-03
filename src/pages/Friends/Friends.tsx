import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, Check, X, MessageSquare, Trash2, Users } from "lucide-react";
import { useFriendsStore, type Connection, type PublicUser } from "./FriendsZustand";
import { useAuthStore } from "../Auth/AuthZustand";
import { useMessagesStore } from "../Messages/MessagesZustand";
import { PageHeader, EmptyState, ErrorBanner, field, primaryBtn, ghostBtn, card } from "../../components/ui/kit";

type Tab = "friends" | "incoming" | "outgoing";

function Avatar({ user, size = 36 }: { user: PublicUser; size?: number }) {
  return (
    <img
      src={user.avatar_url ?? `https://placehold.co/72x72/eef4ff/3f76ff?text=${user.display_name.charAt(0).toUpperCase()}`}
      alt=""
      style={{ width: size, height: size }}
      className="rounded-full border border-gray-200 object-cover"
    />
  );
}

export default function Friends() {
  const me = useAuthStore((s) => s.user?.id);
  const { results, connections, loading, error, searchUsers, fetchConnections, sendRequest, respond, removeConnection } = useFriendsStore();
  const openConversation = useMessagesStore((s) => s.openConversation);
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("friends");

  useEffect(() => {
    void fetchConnections();
  }, [fetchConnections]);

  const other = (c: Connection) => (c.requester_id === me ? c.addressee : c.requester);
  const accepted = connections.filter((c) => c.status === "accepted");
  const incoming = connections.filter((c) => c.status === "pending" && c.addressee_id === me);
  const outgoing = connections.filter((c) => c.status === "pending" && c.requester_id === me);
  const list = tab === "friends" ? accepted : tab === "incoming" ? incoming : outgoing;
  const relatedIds = new Set(connections.flatMap((c) => [c.requester_id, c.addressee_id]));
  const shownResults = results.filter((u) => u.id !== me); // never show your own account

  const onSearch = (e: FormEvent) => { e.preventDefault(); void searchUsers(q); };
  const onMessage = async (userId: string) => { const id = await openConversation(userId); if (id) navigate("/messages"); };

  return (
    <div className="space-y-5">
      <PageHeader title="Friends" count={accepted.length} subtitle="Find people, connect, and chat." />
      <ErrorBanner error={error} />

      <form onSubmit={onSearch} className={`flex items-center gap-2 p-3 ${card}`}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={field + " pl-9"} placeholder="Search users by name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className={primaryBtn} disabled={loading}>Search</button>
      </form>

      {shownResults.length > 0 && (
        <div className={`divide-y divide-gray-100 ${card}`}>
          {shownResults.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2.5">
                <Avatar user={u} />
                <span className="text-sm font-medium text-gray-800">{u.display_name}</span>
              </span>
              {relatedIds.has(u.id) ? (
                <span className="text-xs text-gray-400">connected / pending</span>
              ) : (
                <button onClick={() => sendRequest(u.id)} className={primaryBtn}><UserPlus size={15} /> Add</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium">
        {(["friends", "incoming", "outgoing"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md py-1.5 capitalize transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            {t}{t === "incoming" && incoming.length > 0 ? ` (${incoming.length})` : ""}
          </button>
        ))}
      </div>

      {list.length === 0 && !loading ? (
        <EmptyState icon={<Users size={28} />} text="Nothing here yet." />
      ) : (
        <div className={`divide-y divide-gray-100 ${card}`}>
          {list.map((c) => {
            const u = other(c);
            return (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-2.5">
                  <Avatar user={u} />
                  <span className="text-sm font-medium text-gray-800">{u.display_name}</span>
                </span>
                <span className="flex gap-2">
                  {tab === "friends" && (
                    <>
                      <button onClick={() => onMessage(u.id)} className={primaryBtn}><MessageSquare size={15} /> Message</button>
                      <button onClick={() => removeConnection(c.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"><Trash2 size={15} /></button>
                    </>
                  )}
                  {tab === "incoming" && (
                    <>
                      <button onClick={() => respond(c.id, "accepted")} className={primaryBtn}><Check size={15} /> Accept</button>
                      <button onClick={() => respond(c.id, "rejected")} className={ghostBtn}><X size={15} /></button>
                    </>
                  )}
                  {tab === "outgoing" && (
                    <button onClick={() => removeConnection(c.id)} className={ghostBtn}>Cancel</button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
