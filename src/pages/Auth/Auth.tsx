import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import { useAuthStore } from "./AuthZustand";

const field =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function Auth() {
  const { loading, error, register, login, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const switchMode = (next: "login" | "register") => {
    clearError();
    setMode(next);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok =
      mode === "register"
        ? await register(email, password, displayName)
        : await login(email, password);
    if (ok) navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-brand-50 via-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-200">
            <Layers size={22} />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">Welcome to Taskly</h1>
          <p className="text-sm text-gray-500">
            {mode === "register" ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-md py-1.5 transition ${mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-md py-1.5 transition ${mode === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Register
            </button>
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={field} type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {mode === "register" && (
              <input className={field} type="text" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
