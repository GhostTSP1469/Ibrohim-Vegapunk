import { useState, type FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, Globe, UserRound } from "lucide-react";
import { useAuthStore } from "./AuthZustand";
import { getToken } from "../../api";

const field =
  "w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all duration-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100";

export default function Auth() {
  const { loading, error, register: registerUser, login, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("register");
  const isLogin = mode === "login";

  // Controlled fields — shared across the mobile + desktop copies of the form so
  // there's no react-hook-form ref conflict (which was silently blocking submit).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const switchMode = (next: "login" | "register") => {
    clearError();
    setFormError(null);
    setMode(next);
  };

  const onLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }
    const ok = await login(email.trim(), password);
    if (ok) navigate("/");
  };

  const onRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!displayName.trim()) return setFormError("Please enter your name.");
    if (!email.trim()) return setFormError("Please enter your email.");
    if (password.length < 8) return setFormError("Password must be at least 8 characters.");
    const ok = await registerUser(email.trim(), password, displayName.trim());
    if (ok) navigate("/");
  };

  const shownError = formError ?? error;

  // Already signed in → never show the login page (fixes browser-back to /auth).
  if (getToken()) return <Navigate to="/" replace />;

  const errorBox = shownError ? (
    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{shownError}</p>
  ) : null;

  const NameField = (
    <div className="relative">
      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input className={field} type="text" placeholder="Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
    </div>
  );
  const EmailField = (
    <div className="relative">
      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </div>
  );
  const PasswordField = (
    <div className="relative">
      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </div>
  );
  const submitBtn = (label: string) => (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:shadow-emerald-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? "Please wait…" : label}
    </button>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 p-4">
      {/* Decorative background shapes */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rotate-12 bg-gradient-to-br from-rose-400 to-red-500 opacity-90 [clip-path:polygon(0_0,100%_0,100%_100%)]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 opacity-90" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-6 w-6 rounded-full bg-emerald-400/60" />

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-gray-300/60" style={{ minHeight: 540 }}>
        {/* Mobile: single stacked form */}
        <div className="p-8 md:hidden">
          <div className="mb-6 flex rounded-full bg-gray-100 p-1 text-sm font-medium">
            <button type="button" onClick={() => switchMode("login")} className={`flex-1 rounded-full py-2 transition ${isLogin ? "bg-emerald-500 text-white shadow" : "text-gray-500"}`}>Login</button>
            <button type="button" onClick={() => switchMode("register")} className={`flex-1 rounded-full py-2 transition ${!isLogin ? "bg-emerald-500 text-white shadow" : "text-gray-500"}`}>Register</button>
          </div>

          {errorBox}

          {isLogin ? (
            <form onSubmit={onLoginSubmit} className="space-y-3">
              {EmailField}
              {PasswordField}
              {submitBtn("SIGN IN")}
              <p className="text-center text-xs text-gray-400">Don't have an account?{" "}
                <button type="button" onClick={() => switchMode("register")} className="font-semibold text-emerald-600 hover:text-emerald-700">Sign up</button>
              </p>
            </form>
          ) : (
            <form onSubmit={onRegisterSubmit} className="space-y-3">
              {NameField}
              {EmailField}
              {PasswordField}
              {submitBtn("SIGN UP")}
              <p className="text-center text-xs text-gray-400">Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold text-emerald-600 hover:text-emerald-700">Login</button>
              </p>
            </form>
          )}
        </div>

        {/* Desktop split panel */}
        <div className="relative hidden md:block" style={{ minHeight: 540 }}>
          {/* Login form — fixed left half */}
          <div
            className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-center p-10 transition-opacity duration-500"
            style={{ opacity: isLogin ? 1 : 0, pointerEvents: isLogin ? "auto" : "none", zIndex: isLogin ? 20 : 10 }}
          >
            <form onSubmit={onLoginSubmit} className="w-full max-w-xs">
              <h2 className="mb-1 text-2xl font-bold text-emerald-600">Sign In</h2>
              <p className="mb-5 text-sm text-gray-400">Welcome back! Great to see you again</p>
              {isLogin && errorBox}
              <div className="space-y-3">{EmailField}{PasswordField}</div>
              <div className="mt-6">{submitBtn("SIGN IN")}</div>
              <p className="mt-4 text-center text-xs text-gray-400">Don't have an account?{" "}
                <button type="button" onClick={() => switchMode("register")} className="font-semibold text-emerald-600 transition hover:text-emerald-700">Sign up</button>
              </p>
            </form>
          </div>

          {/* Register form — fixed right half */}
          <div
            className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-center p-10 transition-opacity duration-500"
            style={{ opacity: !isLogin ? 1 : 0, pointerEvents: !isLogin ? "auto" : "none", zIndex: !isLogin ? 20 : 10 }}
          >
            <form onSubmit={onRegisterSubmit} className="w-full max-w-xs">
              <h2 className="mb-1 text-2xl font-bold text-emerald-600">Create Account</h2>
              <p className="mb-4 text-sm text-gray-400">Welcome! Let's get you started</p>
              <div className="mb-4 flex justify-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400"><UserRound size={14} /></span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400"><Globe size={14} /></span>
              </div>
              <p className="mb-5 text-center text-xs text-gray-400">or use your email for registration</p>
              {!isLogin && errorBox}
              <div className="space-y-3">{NameField}{EmailField}{PasswordField}</div>
              <div className="mt-6">{submitBtn("SIGN UP")}</div>
              <p className="mt-4 text-center text-xs text-gray-400">Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold text-emerald-600 transition hover:text-emerald-700">Login</button>
              </p>
            </form>
          </div>

          {/* Sliding colored overlay — messaging only, never covers the active form */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-30 w-1/2 overflow-hidden transition-transform duration-700"
            style={{ transform: isLogin ? "translateX(100%)" : "translateX(0%)", transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)" }}
          >
            <div className="relative flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-10 text-center text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-14 -left-10 h-48 w-48 rounded-full bg-white/10" />
              {!isLogin ? (
                <div className="relative animate-[fadeIn_0.6s_ease]">
                  <h2 className="mb-2 text-2xl font-bold">Welcome Back!</h2>
                  <p className="text-[16px] text-white/80">To keep connected with us please login with your personal info</p>
                </div>
              ) : (
                <div className="relative animate-[fadeIn_0.6s_ease]">
                  <h2 className="mb-2 text-2xl font-bold">Hello, Friend!</h2>
                  <p className="text-sm text-white/80">Enter your details and start your journey with us</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
