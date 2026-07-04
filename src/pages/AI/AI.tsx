import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Sparkles,
  ChevronDown,
  Plus,
  Wand2,
  Mic,
  ArrowUp,
  CornerDownRight,
  Bot,
  Check,
} from "lucide-react";
import { useWorkspaceStore } from "../Workspace/WorkspaceZustand";

type Provider = "openai" | "gemini";
type AiModel = { id: string; label: string; tag: string; provider: Provider };

const AI_MODELS: AiModel[] = [
  { id: "gpt-5.4", label: "GPT-5.4", tag: "Fast & balanced", provider: "openai" },
  { id: "gpt-5.2", label: "GPT-5.2", tag: "Lightweight", provider: "openai" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "Deep reasoning", provider: "gemini" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tag: "Instant", provider: "gemini" },
];

const PROVIDER_STYLE: Record<Provider, { badge: string; ring: string }> = {
  openai: { badge: "#131a2e", ring: "rgba(19,26,46,0.15)" },
  gemini: { badge: "#4285f4", ring: "rgba(66,133,244,0.15)" },
};

const SUGGESTIONS = [
  "Create a Page in the Wiki with work logs for each member in the last month",
  "Create a Sticky with details of all Urgent workitems across this workspace",
];

type ChatMessage = { role: "user" | "assistant"; content: string };

/* ── Simulated AI brain ──────────────────────────────────────────────
   No API key, no backend — generates a plausible, on-topic reply based
   on the question. Swap this out later for a real fetch() once you
   stand up your own backend endpoint (never call OpenAI/Gemini directly
   from the frontend with a raw key — it'll leak). */
function generateReply(question: string, workspaceName: string): string {
  const q = question.toLowerCase();

  if (q.includes("wiki") && q.includes("page")) {
    return `Done — I drafted a new Wiki page called **"Work Logs — ${workspaceName}"**.\n\nIt's organized by member, with sections for completed issues, cycles touched, and a short summary line for each week. You can open it from the Wiki tab and tweak the layout — I left placeholders where real activity data will slot in once it's connected.`;
  }
  if (q.includes("sticky") || q.includes("urgent")) {
    return `Created a new Sticky titled **"Urgent — This Week"**.\n\nIt lists every issue currently marked Urgent across your projects, grouped by project name, with the assignee and due date next to each one. Pinned it to your dashboard so it's visible on login.`;
  }
  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("bro")) {
    return `Hey! Good to see you. I can help you draft Wiki pages, summarize issues, plan cycles, or just talk through what you're building in **${workspaceName}**. What do you want to tackle first?`;
  }
  if (q.includes("how are you")) {
    return `Running smooth, thanks for asking! Ready whenever you are — want me to look at your open issues, plan a cycle, or draft something for the Wiki?`;
  }
  if (q.includes("issue") || q.includes("bug") || q.includes("task")) {
    return `Here's a quick breakdown of what I'd suggest:\n\n1. Triage — sort by severity, close stale duplicates\n2. Assign owners for anything Urgent or High\n3. Batch the small fixes into one cycle so they don't clutter the backlog\n\nWant me to draft the actual issue list for one of your projects?`;
  }
  if (q.includes("cycle") || q.includes("sprint")) {
    return `For your next cycle, I'd scope it to roughly 2 weeks and cap it at what your team closed last cycle — that keeps velocity honest instead of aspirational. I can pre-fill a cycle plan with your open Medium/High issues if you tell me which project.`;
  }
  if (q.includes("summar")) {
    return `Summary of **${workspaceName}**: most activity this week has been concentrated in your active cycle, with steady issue closure and no major blockers flagged. I can go deeper on a specific project if you point me to one.`;
  }

  return `Good question. Here's my take:\n\n${question.charAt(0).toUpperCase() + question.slice(1)} — I'd approach this by breaking it into smaller, trackable pieces inside **${workspaceName}**, so progress is visible instead of buried in one big task. If you want, I can turn this straight into a Wiki page or a set of issues.`;
}

export default function AI() {
  const { workspaceSlug = "" } = useParams();
  const { workspaces } = useWorkspaceStore();
  const activeWorkspace = workspaces.find((w) => w.slug === workspaceSlug);
const workspaceName = activeWorkspace?.name ?? (workspaceSlug || "your workspace");
  const [selectedModel, setSelectedModel] = useState<AiModel>(AI_MODELS[0]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    return () => {
      if (streamTimer.current) clearInterval(streamTimer.current);
    };
  }, []);

  function streamReply(fullText: string) {
    setIsStreaming(true);
    setStreamingText("");
    const words = fullText.split(" ");
    let i = 0;
    streamTimer.current = setInterval(() => {
      i++;
      setStreamingText(words.slice(0, i).join(" "));
      if (i >= words.length) {
        if (streamTimer.current) clearInterval(streamTimer.current);
        setIsStreaming(false);
        setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
        setStreamingText("");
      }
    }, 28);
  }

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isThinking || isStreaming) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsThinking(true);

    const thinkDelay = 550 + Math.random() * 500;
    setTimeout(() => {
      setIsThinking(false);
      streamReply(generateReply(trimmed, workspaceName));
    }, thinkDelay);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  const started = messages.length > 0 || isThinking || isStreaming;
  const busy = isThinking || isStreaming;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white font-sans text-gray-900">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-96 w-[720px] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl"
        style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
      />

      {/* ── Top bar (own stacking layer, always above chat body) ── */}
      <div className="relative z-30 flex items-center justify-between border-b border-gray-100 bg-white/90 px-5 py-3 backdrop-blur-md">
        <div className="relative">
          <button
            onClick={() => setModelMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #131a2e, #10b981)" }}
            >
              <Sparkles size={12} strokeWidth={2.5} />
            </span>
            <span>
              Plane AI <span className="text-gray-400">({selectedModel.label})</span>
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-300 ease-out ${modelMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {modelMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setModelMenuOpen(false)} />
              <div
                className="absolute left-0 top-full z-50 mt-2 w-64 origin-top-left overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_12px_40px_-8px_rgba(19,26,46,0.25)]"
                style={{ animation: "aiMenuIn 0.16s cubic-bezier(0.22, 1, 0.36, 1)" }}
              >
                {AI_MODELS.map((model) => {
                  const active = model.id === selectedModel.id;
                  const style = PROVIDER_STYLE[model.provider];
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setModelMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                        active ? "bg-emerald-50/70" : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                        style={{ background: style.badge, boxShadow: `0 0 0 4px ${style.ring}` }}
                      >
                        {model.provider === "openai" ? "O" : "G"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-gray-900">{model.label}</span>
                        <span className="block truncate text-[11px] text-gray-400">{model.tag}</span>
                      </span>
                      {active && (
                        <span
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
                          style={{ background: "#10b981" }}
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      {!started ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
          <div style={{ animation: "aiFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }} className="flex flex-col items-center">
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #131a2e, #10b981)" }}
            >
              <Sparkles size={20} />
            </div>
            <h1 className="mb-6 text-[27px] font-semibold tracking-tight text-gray-900">What can I do for you?</h1>
          </div>

          <div style={{ animation: "aiFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both" }} className="w-full max-w-[600px]">
            <ChatInputBox
              input={input}
              setInput={setInput}
              onSend={() => handleSend(input)}
              onKeyDown={handleKeyDown}
              busy={busy}
              workspaceName={workspaceName}
            />
          </div>

          <div
            style={{ animation: "aiFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.16s both" }}
            className="mt-8 w-full max-w-[600px]"
          >
            <p className="mb-2 text-[13px] font-medium text-gray-400">Suggestions</p>
            <div className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="flex items-center gap-2.5 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors hover:bg-emerald-50/60"
                >
                  <CornerDownRight size={15} className="shrink-0 text-gray-400" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-[720px] flex-col gap-5">
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}

              {isThinking && (
                <div className="flex items-start gap-2.5" style={{ animation: "aiFadeUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                  <Avatar />
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-gray-50 px-4 py-3">
                    <span className="dot" style={{ animationDelay: "0ms" }} />
                    <span className="dot" style={{ animationDelay: "150ms" }} />
                    <span className="dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {isStreaming && <MessageBubble role="assistant" content={streamingText} streaming />}
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
            <div className="mx-auto max-w-[720px]">
              <ChatInputBox
                input={input}
                setInput={setInput}
                onSend={() => handleSend(input)}
                onKeyDown={handleKeyDown}
                busy={busy}
                workspaceName={workspaceName}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes aiFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aiMenuIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #9ca3af;
          animation: aiBounce 1s ease-in-out infinite;
        }
        @keyframes aiBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        .cursor-blink::after {
          content: "▍";
          display: inline-block;
          margin-left: 1px;
          color: #10b981;
          animation: aiBlink 0.9s steps(1) infinite;
        }
        @keyframes aiBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Avatar() {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
      style={{ background: "linear-gradient(135deg, #131a2e, #10b981)" }}
    >
      <Bot size={13} />
    </div>
  );
}

function renderInline(text: string) {
  // lightweight **bold** support, no markdown lib needed
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={idx} className="font-semibold text-gray-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end" style={{ animation: "aiFadeUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)" }}>
        <div
          className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-sm px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #131a2e, #1c2540)" }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5" style={{ animation: "aiFadeUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)" }}>
      <Avatar />
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-gray-100 bg-gray-50 px-4 py-3 text-[14px] leading-relaxed text-gray-800 ${
          streaming ? "cursor-blink" : ""
        }`}
      >
        {renderInline(content)}
      </div>
    </div>
  );
}

function ChatInputBox({
  input,
  setInput,
  onSend,
  onKeyDown,
  busy,
  workspaceName,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  busy: boolean;
  workspaceName: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all focus-within:border-emerald-300 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1 text-[12px] font-medium text-gray-700">
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #131a2e, #10b981)" }}
          >
            {workspaceName.charAt(0).toUpperCase()}
          </span>
          {workspaceName}
        </span>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="How can I help you today?"
        rows={2}
        className="w-full resize-none px-1 text-[14px] text-gray-800 outline-none placeholder:text-gray-400"
      />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-400">
          <button className="rounded-lg p-1.5 transition-colors hover:bg-gray-50 hover:text-gray-600">
            <Plus size={16} />
          </button>
          <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors hover:bg-gray-50 hover:text-gray-600">
            <Wand2 size={14} /> Build <ChevronDown size={12} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
            <Mic size={16} />
          </button>
          <button
            onClick={onSend}
            disabled={busy || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: busy || !input.trim() ? "#d1d5db" : "linear-gradient(135deg, #131a2e, #10b981)" }}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
