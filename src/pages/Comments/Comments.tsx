import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useCommentsStore, type Comment } from "./CommentsZustand";

const textarea =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";

export default function Comments() {
  const { workspaceSlug = "", projectId = "", issueId = "" } = useParams();
  const { comments, loading, error, fetchComments, createComment, updateComment, deleteComment } =
    useCommentsStore();
  const [body, setBody] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    void fetchComments(workspaceSlug, projectId, issueId);
  }, [fetchComments, workspaceSlug, projectId, issueId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (await createComment(workspaceSlug, projectId, issueId, { body })) setBody("");
  };

  const startEdit = (c: Comment) => {
    setEditId(c.id);
    setEditBody(c.body);
  };

  const onSaveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (await updateComment(workspaceSlug, projectId, issueId, id, editBody)) setEditId(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Comments</h1>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="space-y-2">
        <textarea className={textarea} rows={3} placeholder="Write a comment (markdown)…" value={body} onChange={(e) => setBody(e.target.value)} required />
        <button className={btn} disabled={loading}>Comment</button>
      </form>

      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border bg-white px-3 py-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-gray-400">{c.author?.display_name ?? c.author_id}</span>
              <span className="flex gap-3">
                <button onClick={() => startEdit(c)} className="text-sm text-brand-600 hover:underline">Edit</button>
                <button onClick={() => deleteComment(workspaceSlug, projectId, issueId, c.id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </span>
            </div>
            {editId === c.id ? (
              <form onSubmit={(e) => onSaveEdit(e, c.id)} className="space-y-2">
                <textarea className={textarea} rows={3} value={editBody} onChange={(e) => setEditBody(e.target.value)} required />
                <div className="flex gap-2">
                  <button className={btn} disabled={loading}>Save</button>
                  <button type="button" onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                </div>
              </form>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-gray-800">{c.body}</p>
            )}
          </li>
        ))}
        {!loading && comments.length === 0 && <li className="text-gray-400">No comments yet.</li>}
      </ul>
    </div>
  );
}
