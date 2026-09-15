import { useEffect } from "react";
import api from "../api/api";

// ProtectedRoute only checks a localStorage flag before rendering — no
// server round trip — so a dashboard whose session already died server-
// side (the 15-minute idle cookie, see backend/middleware/auth.js) still
// renders normally: the Navbar, the time-based greeting, everything looks
// fine, right up until the user tries to do something that actually hits
// the API (upload, etc.) and only then discovers they're logged out.
//
// This pings a lightweight authenticated endpoint on load and whenever
// the tab becomes visible again, so a dead session is caught immediately
// instead of on the next user action. If the session is dead, the 401
// response is handled by the existing interceptor in api/api.js, which
// clears local state and redirects to /login?sessionExpired=1.
export default function SessionGuard() {
  useEffect(() => {
    const checkSession = () => {
      // Only relevant for someone who currently appears logged in — a
      // signed-out visitor on /login etc. has nothing to check.
      if (localStorage.getItem("isLoggedIn") !== "true") return;
      api.get("/auth/me").catch(() => {
        // Failure is handled by the response interceptor (401 → redirect).
        // Any other error (e.g. offline) is left alone here — no need to
        // log the user out over a network hiccup.
      });
    };

    checkSession();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
