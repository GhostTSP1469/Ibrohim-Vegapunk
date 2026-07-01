import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./AuthZustand";

export default function Auth() {
  const { loading, error, register, login, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");

  const switchMode = (next: "login" | "register") => {
    clearError();
    setMode(next);
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok =
      mode === "register"
        ? await register(email, password, displayName)
        : await login(email, password);
    if (ok) navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          {mode === "register" ? "Create account" : "Sign in"}
        </h1>

        {/* mode switch */}
        <div className="flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-md py-1.5 ${
              mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-md py-1.5 ${
              mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "register" && (
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "..." : mode === "register" ? "Register" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
