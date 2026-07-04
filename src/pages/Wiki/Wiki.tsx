import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Search,
  BookOpen,
  Sun,
  Moon,
  CloudSun,
  Palette,
  Bold,
  Italic,
  List,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";

/* ── Types ── */
type NoteColor = "blue" | "yellow" | "pink" | "green" | "purple" | "gray";

type WikiNote = {
  id: string;
  content: string;
  color: NoteColor;
  bold: boolean;
  italic: boolean;
  createdAt: number;
  updatedAt: number;
};

type Toast = { id: string; title: string; subtitle: string };

/* ── LocalStorage persistence ──────────────────────────────────────
   No backend for Wiki yet, so notes live in localStorage per workspace.
   Swap loadNotes/saveNotes for real API calls once the endpoint exists —
   everything else (UI, state shape) stays the same. */
function storageKey(workspaceSlug: string) {
  return `wiki_notes:${workspaceSlug}`;
}

function loadNotes(workspaceSlug: string): WikiNote[] {
  try {
    const raw = localStorage.getItem(storageKey(workspaceSlug));
    return raw ? (JSON.parse(raw) as WikiNote[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(workspaceSlug: string, notes: WikiNote[]) {
  localStorage.setItem(storageKey(workspaceSlug), JSON.stringify(notes));
}

const COLOR_STYLES: Record<NoteColor, { bg: string; swatch: string; border: string }> = {
  blue: { bg: "#dbe6fb", swatch: "#93b4f0", border: "#c3d5f7" },
  yellow: { bg: "#faf0c8", swatch: "#e8cf6a", border: "#f2e3a8" },
  pink: { bg: "#fbdde9", swatch: "#f0a3c3", border: "#f6c7dc" },
  green: { bg: "#dcf3e3", swatch: "#8fd6a8", border: "#c2ebd0" },
  purple: { bg: "#e6ddfb", swatch: "#b39cf0", border: "#d5c6f7" },
  gray: { bg: "#e7e9ee", swatch: "#aab0bf", border: "#d5d8e0" },
};

function greeting(hour: number) {
  if (hour < 5) return { text: "Good night", Icon: Moon };
  if (hour < 12) return { text: "Good morning", Icon: Sun };
  if (hour < 18) return { text: "Good afternoon", Icon: CloudSun };
  return { text: "Good evening", Icon: Moon };
}

function formatDate(d: Date) {
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const month = d.toLocaleDateString(undefined, { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${weekday}, ${month} ${day} ${time}`;
}

function useDisplayName() {
  return useMemo(() => {
    try {
      return localStorage.getItem("user_display_name") || "there";
    } catch {
      return "there";
    }
  }, []);
}

export default function Wiki() {
  const { workspaceSlug = "" } = useParams();
  const displayName = useDisplayName();

  const [now, setNow] = useState(new Date());
  const [notes, setNotes] = useState<WikiNote[]>([]);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Load notes for the active workspace — React's "adjust state during render"
  // pattern (track previous slug in state), avoiding a set-state-in-effect.
  const [prevSlug, setPrevSlug] = useState<string | undefined>(undefined);
  if (workspaceSlug !== prevSlug) {
    setPrevSlug(workspaceSlug);
    setNotes(loadNotes(workspaceSlug));
  }

  function pushToast(title: string, subtitle: string) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, subtitle }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }

  function persist(next: WikiNote[]) {
    setNotes(next);
    saveNotes(workspaceSlug, next);
  }

  function addNote() {
    const colors: NoteColor[] = ["blue", "yellow", "pink", "green", "purple", "gray"];
    const note: WikiNote = {
      id: crypto.randomUUID(),
      content: "",
      color: colors[Math.floor(Math.random() * colors.length)],
      bold: false,
      italic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persist([note, ...notes]);
    setFocusId(note.id);
    pushToast("Page created", "The page has been successfully created.");
  }

  function updateNote(id: string, patch: Partial<WikiNote>) {
    persist(notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  }

  function deleteNote(id: string) {
    persist(notes.filter((n) => n.id !== id));
    pushToast("Page deleted", "The page has been removed.");
  }

  const { text: greetText, Icon: GreetIcon } = greeting(now.getHours());
  const filtered = notes.filter((n) => n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative min-h-full overflow-x-hidden bg-white font-sans text-gray-900">
      {/* ambient gradient blobs */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -top-16 right-1/4 h-72 w-72 rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "radial-gradient(circle, #131a2e 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-16">
        {/* ── Greeting header ── */}
        <div
          className="mb-14 flex flex-col items-center text-center"
          style={{ animation: "wikiFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          <div
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #131a2e, #10b981)" }}
          >
            <GreetIcon size={20} className="animate-[wikiSpin_6s_ease-in-out_infinite]" />
          </div>
          <h1 className="text-[30px] font-semibold tracking-tight text-gray-900">
            {greetText}, <span className="text-emerald-600">{displayName}</span>
          </h1>
          <p className="mt-1.5 text-[14px] text-gray-400">{formatDate(now)}</p>
        </div>

        {/* ── Recents ── */}
        <Section title="Recents" style={{ animation: "wikiFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both" }}>
          {notes.length === 0 ? (
            <EmptyState icon={<BookOpen size={30} strokeWidth={1.5} />} message="You don't have any recents yet." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...notes]
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, 4)
                .map((n, i) => (
                  <RecentPreview key={n.id} note={n} index={i} />
                ))}
            </div>
          )}
        </Section>

        {/* ── Your pages ── */}
        <Section
          title="Your Wiki pages"
          style={{ animation: "wikiFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.16s both" }}
          actions={
            <div className="flex items-center gap-3">
              {notes.length > 0 && (
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search pages..."
                    className="w-40 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-[12.5px] text-gray-700 outline-none transition-colors focus:border-emerald-300 focus:bg-white"
                  />
                </div>
              )}
              <button
                onClick={addNote}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-white shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #131a2e, #10b981)" }}
              >
                <Plus size={14} /> Add page
              </button>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={30} strokeWidth={1.5} />}
              message={
                notes.length === 0
                  ? "Jot down an idea, capture a plan, or write out your thoughts. Add a page to get started."
                  : "No pages match your search."
              }
              action={
                notes.length === 0 && (
                  <button
                    onClick={addNote}
                    className="mt-4 flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #131a2e, #10b981)" }}
                  >
                    <Plus size={14} /> Add your first page
                  </button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((n, i) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  index={i}
                  autoFocus={focusId === n.id}
                  onUpdate={(patch) => updateNote(n.id, patch)}
                  onDelete={() => deleteNote(n.id)}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Toasts ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex w-80 items-start gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-[0_12px_32px_-8px_rgba(19,26,46,0.25)]"
            style={{ animation: "toastIn 0.32s cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-500" fill="#10b981" fillOpacity={0.15} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-gray-900">{t.title}</p>
              <p className="mt-0.5 text-[12.5px] text-gray-500">{t.subtitle}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="shrink-0 text-gray-300 transition-colors hover:text-gray-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes wikiFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wikiSpin {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes wikiFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({
  title,
  children,
  actions,
  style,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="mb-10" style={style}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-gray-800">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/80 to-white px-6 py-14 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-emerald-500/70"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(19,26,46,0.05))",
          animation: "wikiFloat 3.5s ease-in-out infinite",
        }}
      >
        {icon}
      </div>
      <p className="max-w-sm text-[13.5px] leading-relaxed text-gray-500">{message}</p>
      {action}
    </div>
  );
}

/* ── Compact preview used in Recents ── */
function RecentPreview({ note, index }: { note: WikiNote; index: number }) {
  const c = COLOR_STYLES[note.color];
  return (
    <div
      className="h-24 overflow-hidden rounded-xl border p-3 shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        background: c.bg,
        borderColor: c.border,
        animation: `wikiFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.05}s both`,
      }}
    >
      <p
        className="line-clamp-4 text-[12px] leading-snug text-gray-700"
        style={{ fontWeight: note.bold ? 700 : 400, fontStyle: note.italic ? "italic" : "normal" }}
      >
        {note.content || "Empty page"}
      </p>
    </div>
  );
}

/* ── Editable sticky-style note card ── */
function NoteCard({
  note,
  index,
  autoFocus,
  onUpdate,
  onDelete,
}: {
  note: WikiNote;
  index: number;
  autoFocus?: boolean;
  onUpdate: (patch: Partial<WikiNote>) => void;
  onDelete: () => void;
}) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const c = COLOR_STYLES[note.color];

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    resize();
  }, [note.content]);

  function insertBullet() {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? note.content.length;
    const before = note.content.slice(0, pos);
    const after = note.content.slice(pos);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insertion = `${needsNewline ? "\n" : ""}• `;
    onUpdate({ content: before + insertion + after });
    requestAnimationFrame(() => {
      el.focus();
      const caret = pos + insertion.length;
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <div
      className="group relative flex h-72 flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md"
      style={{
        background: c.bg,
        borderColor: c.border,
        animation: `wikiFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.05}s both`,
      }}
    >
      <textarea
        ref={textareaRef}
        value={note.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Click to type here"
        className="min-h-0 flex-1 resize-none overflow-y-auto bg-transparent px-4 pt-4 text-[14px] leading-relaxed text-gray-700 outline-none placeholder:text-gray-500/60"
        style={{ fontWeight: note.bold ? 700 : 400, fontStyle: note.italic ? "italic" : "normal" }}
      />

      <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: c.border }}>
        <div className="flex items-center gap-0.5">
          <div className="relative">
            <ToolbarBtn active={colorPickerOpen} onClick={() => setColorPickerOpen((v) => !v)}>
              <Palette size={14} />
            </ToolbarBtn>
            {colorPickerOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setColorPickerOpen(false)} />
                <div className="absolute bottom-8 left-0 z-40 flex gap-1.5 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                  {(Object.keys(COLOR_STYLES) as NoteColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onUpdate({ color });
                        setColorPickerOpen(false);
                      }}
                      className="h-5 w-5 rounded-full ring-offset-2 transition-transform hover:scale-110"
                      style={{
                        background: COLOR_STYLES[color].swatch,
                        boxShadow: note.color === color ? `0 0 0 2px ${COLOR_STYLES[color].swatch}` : undefined,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <ToolbarBtn active={note.bold} onClick={() => onUpdate({ bold: !note.bold })}>
            <Bold size={14} />
          </ToolbarBtn>
          <ToolbarBtn active={note.italic} onClick={() => onUpdate({ italic: !note.italic })}>
            <Italic size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={insertBullet}>
            <List size={14} />
          </ToolbarBtn>
        </div>

        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-gray-500/70 transition-colors hover:bg-black/5 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors ${
        active ? "bg-black/10 text-gray-900" : "text-gray-500/70 hover:bg-black/5 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
