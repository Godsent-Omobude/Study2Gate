import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/study2gate-logo.png";
import { Eye, EyeOff, Download } from "lucide-react";
import { safeInternalPath } from "../utils/safeRedirect";
import { friendlyErrorMessage } from "../utils/errorMessage";
import EqualizerLoader from "../components/EqualizerLoader";
import BackendStatusBanner from "../components/BackendStatusBanner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Where to send the user after a successful login — e.g. back to the
  // Study Circle invitation they were on before being asked to sign in.
  // Only ever an internal route: never trust this for an off-site redirect.
  const redirectTo = safeInternalPath(searchParams.get("redirect"), "/");

  // Set by the axios interceptor (api/api.js) when a request came back 401
  // for a user who appeared logged in — i.e. their session actually died
  // server-side, as opposed to a plain login failure below.
  useEffect(() => {
    if (searchParams.get("sessionExpired") === "1") {
      setError("Your session expired. Please log in again.");
    }
  }, [searchParams]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const response = await api.post("/auth/login", { username, password });

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", String(response.data.id || ""));
      localStorage.setItem("fullName", response.data.fullName || username);
      localStorage.setItem("username", response.data.username || username);
      localStorage.setItem("email", response.data.email || "");
      localStorage.setItem("matricNumber", response.data.matricNumber || "");
      localStorage.setItem("role", response.data.role || "student");
      localStorage.setItem("profilePicture", response.data.profilePicture || "");
      localStorage.setItem("theme", response.data.theme || "system");
      localStorage.setItem("accentColor", response.data.accentColor || "blue");

      navigate(redirectTo);
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response?.data?.message || "Too many login attempts. Please try again later.");
      } else if (err.response?.status === 403 && err.response?.data?.verificationRequired) {
        navigate("/verify-email", {
          state: {
            email: err.response.data.email || "",
            message: err.response.data.message,
          },
        });
        return;
      } else if (
        err.response?.status === 403 &&
        err.response?.data?.copyrightPolicyAcceptanceRequired
      ) {
        navigate("/accept-policy", {
          state: {
            pendingToken: err.response.data.pendingToken,
            redirectTo,
          },
        });
        return;
      } else {
        setError(friendlyErrorMessage(err, "Authentication system failure."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackendStatusBanner />
      <div className="min-h-screen bg-[#171238] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-[#171238] to-blue-700 p-12 text-white lg:block">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Study2Gate logo"
                className="h-12 w-12 rounded-2xl object-contain"
              />
              <div className="text-3xl font-black tracking-tight">
                Study<span className="logo-mark text-blue-300">Share</span>
              </div>
            </div>
            <div className="mt-24">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-200">
                Academic workspace
              </p>
              <h1 className="mt-4 text-5xl font-black leading-tight">
                Study smarter with your own materials.
              </h1>
              <p className="mt-5 max-w-md text-slate-200">
                Share resources, generate AI flashcards and revise from one organised student platform.
              </p>
            </div>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                <img
                  src={logo}
                  alt="Study2Gate logo"
                  className="h-14 w-14 rounded-2xl object-contain"
                />
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Study<span className="logo-mark text-blue-600">2Gate</span>
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to Study2Gate.
              </p>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-7 space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end -mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-bold text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? <EqualizerLoader label="Signing in…" /> : "Sign In"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                New to Study2Gate?{" "}
                <Link to="/register" className="font-bold text-blue-700 hover:underline">
                  Create an account
                </Link>
              </p>

              <a
                href="/study2gate.apk"
                download
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                Download App
              </a>

              <p className="mt-3 text-center text-xs text-slate-400">
                <Link to="/terms" className="hover:underline">
                  Terms &amp; Conditions
                </Link>
                {" · "}
                <Link to="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
                {" · "}
                <Link to="/copyright" className="hover:underline">
                  Copyright Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
