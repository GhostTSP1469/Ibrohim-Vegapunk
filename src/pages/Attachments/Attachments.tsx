import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useAttachmentsStore } from "./AttachmentsZustand";

const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500";
const btn =
  "rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50";

export default function Attachments() {
  const { workspaceSlug = "", projectId = "", issueId = "" } = useParams();
  const { attachments, loading, error, fetchAttachments, createAttachment, deleteAttachment } =
    useAttachmentsStore();
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  useEffect(() => {
    void fetchAttachments(workspaceSlug, projectId, issueId);
  }, [fetchAttachments, workspaceSlug, projectId, issueId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const res = await createAttachment(workspaceSlug, projectId, issueId, {
      file_name: fileName,
      file_size: Number(fileSize),
      mime_type: mimeType,
    });
    if (res) {
      setUploadUrl(res.upload.url);
      setFileName("");
      setFileSize("");
      setMimeType("");
      void fetchAttachments(workspaceSlug, projectId, issueId);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Attachments</h1>
      {error && <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2">
        <input className={input + " max-w-xs"} placeholder="File name" value={fileName} onChange={(e) => setFileName(e.target.value)} required />
        <input className={input + " max-w-32"} type="number" placeholder="Size (bytes)" value={fileSize} onChange={(e) => setFileSize(e.target.value)} required />
        <input className={input + " max-w-40"} placeholder="MIME type" value={mimeType} onChange={(e) => setMimeType(e.target.value)} required />
        <button className={btn} disabled={loading}>Register</button>
      </form>
      {uploadUrl && (
        <p className="break-all rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Presigned upload URL (PUT the bytes here): {uploadUrl}
        </p>
      )}

      <ul className="space-y-2">
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
            <span>
              {a.download_url ? (
                <a href={a.download_url} target="_blank" className="text-brand-700 hover:underline">
                  {a.file_name}
                </a>
              ) : (
                a.file_name
              )}
              <span className="ml-2 text-xs text-gray-400">{a.mime_type}</span>
            </span>
            <button onClick={() => deleteAttachment(workspaceSlug, projectId, a.id)} className="text-red-600 hover:underline">
              Delete
            </button>
          </li>
        ))}
        {!loading && attachments.length === 0 && <li className="text-gray-400">No attachments yet.</li>}
      </ul>
    </div>
  );
}
