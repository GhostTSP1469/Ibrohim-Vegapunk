import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Mail, Lock, User, Loader2, Globe, UserRound } from "lucide-react";
import { useAuthStore } from "./AuthZustand";

type LoginFormValues = { email: string; password: string };
type RegisterFormValues = { displayName: string; email: string; password: string };

const field =
  "w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all duration-300 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100";

export default function Auth() {
  const { loading, error, register: registerUser, login, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("register");
  const isLogin = mode === "login";

  const switchMode = (next: "login" | "register") => {
    clearError();
    setMode(next);
  };

  const loginForm = useForm<LoginFormValues>();
  const registerForm = useForm<RegisterFormValues>();

  const onLoginSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    const ok = await login(data.email, data.password);
    if (ok) navigate("/");
  };

  const onRegisterSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    const ok = await registerUser(data.email, data.password, data.displayName);
    if (ok) navigate("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 p-4">
      {/* Decorative background shapes */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rotate-12 bg-gradient-to-br from-rose-400 to-red-500 opacity-90 [clip-path:polygon(0_0,100%_0,100%_100%)]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 opacity-90" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-6 w-6 rounded-full bg-emerald-400/60" />

      <div
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-gray-300/60"
        style={{ minHeight: 540 }}
      >
        {/* Mobile: single stacked form */}
        <div className="p-8 md:hidden">
          <div className="mb-6 flex rounded-full bg-gray-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-full py-2 transition ${isLogin ? "bg-emerald-500 text-white shadow" : "text-gray-500"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-full py-2 transition ${!isLogin ? "bg-emerald-500 text-white shadow" : "text-gray-500"}`}
            >
              Register
            </button>
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={field} type="email" placeholder="Email" {...loginForm.register("email", { required: true })} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={field} type="password" placeholder="Password" {...loginForm.register("password", { required: true })} />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 disabled:opacity-50">
                {loading ? "Please wait…" : "SIGN IN"}
              </button>
              <p className="text-center text-xs text-gray-400">
                Don't have an account?{" "}
                <button type="button" onClick={() => switchMode("register")} className="font-semibold text-emerald-600 hover:text-emerald-700">
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={field} type="text" placeholder="Name" {...registerForm.register("displayName", { required: true })} />
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={field} type="email" placeholder="Email" {...registerForm.register("email", { required: true })} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={field} type="password" placeholder="Password" {...registerForm.register("password", { required: true, minLength: 8 })} />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 disabled:opacity-50">
                {loading ? "Please wait…" : "SIGN UP"}
              </button>
              <p className="text-center text-xs text-gray-400">
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-semibold text-emerald-600 hover:text-emerald-700">
                  Login
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Desktop split panel */}
        <div className="relative hidden md:block" style={{ minHeight: 540 }}>
          {/* Login form — fixed left half */}
          <div
            className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-center p-10 transition-opacity duration-500"
            style={{
              opacity: isLogin ? 1 : 0,
              pointerEvents: isLogin ? "auto" : "none",
              zIndex: isLogin ? 20 : 10,
            }}
          >
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="w-full max-w-xs">
              <h2 className="mb-1 text-2xl font-bold text-emerald-600">Sign In</h2>
              <p className="mb-5 text-sm text-gray-400">Welcome back! Great to see you again</p>

              {error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={field}
                    type="email"
                    placeholder="Email"
                    {...loginForm.register("email", { required: true })}
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={field}
                    type="password"
                    placeholder="Password"
                    {...loginForm.register("password", { required: true })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:shadow-emerald-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Please wait…" : "SIGN IN"}
              </button>

              <p className="mt-4 text-center text-xs text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-emerald-600 transition hover:text-emerald-700"
                >
                  Sign up
                </button>
              </p>
            </form>
          </div>

          {/* Register form — fixed right half */}
          <div
            className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-center p-10 transition-opacity duration-500"
            style={{
              opacity: !isLogin ? 1 : 0,
              pointerEvents: !isLogin ? "auto" : "none",
              zIndex: !isLogin ? 20 : 10,
            }}
          >
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="w-full max-w-xs">
              <h2 className="mb-1 text-2xl font-bold text-emerald-600">Create Account</h2>
              <p className="mb-4 text-sm text-gray-400">Welcome! Let's get you started</p>

              <div className="mb-4 flex justify-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400">
                  <UserRound size={14} />
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400">
                  <Globe size={14} />
                </span>
              </div>
              <p className="mb-5 text-center text-xs text-gray-400">or use your email for registration</p>

              {error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={field}
                    type="text"
                    placeholder="Name"
                    {...registerForm.register("displayName", { required: true })}
                  />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={field}
                    type="email"
                    placeholder="Email"
                    {...registerForm.register("email", { required: true })}
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={field}
                    type="password"
                    placeholder="Password"
                    {...registerForm.register("password", { required: true, minLength: 8 })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:shadow-emerald-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Please wait…" : "SIGN UP"}
              </button>

              <p className="mt-4 text-center text-xs text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-emerald-600 transition hover:text-emerald-700"
                >
                  Login
                </button>
              </p>
            </form>
          </div>

          {/* Sliding colored overlay — no buttons, just messaging */}
          <div
            className="absolute inset-y-0 left-0 z-30 w-1/2 overflow-hidden transition-transform duration-700"
            style={{
              transform: isLogin ? "translateX(100%)" : "translateX(0%)",
              transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          >
            <div className="relative flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-10 text-center text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-14 -left-10 h-48 w-48 rounded-full bg-white/10" />

              {!isLogin && (
                <div className="relative animate-[fadeIn_0.6s_ease]">
                  <h2 className="mb-2 text-2xl font-bold">Welcome Back!</h2>
                  <p className="text-[16px] text-white/80">
                    To keep connected with us please login with your personal info
                  </p>
                </div>
              )}

              {isLogin && (
                <div className="relative animate-[fadeIn_0.6s_ease]">
                  <h2 className="mb-2 text-2xl font-bold">Hello, Friend!</h2>
                  <p className="text-sm text-white/80">
                    Enter your details and start your journey with us
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}