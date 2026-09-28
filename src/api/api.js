import axios from "axios";
import { disconnectStudySocket } from "./socket";

const normalizeApiBaseUrl = (url) => {
  const trimmed = String(url || "").trim().replace(/\/$/, "");
  if (!trimmed) {
    return "https://studyshare-backend-1-vopy.onrender.com/api";
  }
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

// In production, calls go to our own domain's /api path, which vercel.json
// rewrites (proxies) to the Render backend. This makes the auth cookie
// first-party instead of cross-site, which Safari's Intelligent Tracking
// Prevention otherwise blocks (see Dashboard 0-flashcards / instant-logout
// investigation). Local dev still talks to the backend directly since
// there's no Vercel proxy running there.
const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : normalizeApiBaseUrl(
        process.env.REACT_APP_API_URL || "https://studyshare-backend-1-vopy.onrender.com"
      );

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Stop any shared Socket.IO connection authenticated with the expired
      // session before redirecting to login.
      disconnectStudySocket();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("fullName");

      if (window.location.pathname !== "/login") {
        // Preserve where the user was (e.g. a Study Circle invitation
        // link) so they land back there after signing back in, instead
        // of losing that context on a session expiry.
        const returnTo = `${window.location.pathname}${window.location.search}`;
        const redirectParam = returnTo && returnTo !== "/" ? `?redirect=${encodeURIComponent(returnTo)}` : "";
        window.location.href = `/login${redirectParam}`;
      }
    }

    // The session cookie is still valid, but the account hasn't accepted
    // the (possibly newly introduced/updated) Copyright Policy yet. Send
    // the user to the acceptance gate instead of leaving whatever page
    // they were on stuck on a failed request.
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === "COPYRIGHT_POLICY_ACCEPTANCE_REQUIRED" &&
      window.location.pathname !== "/accept-policy"
    ) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const redirectParam = returnTo && returnTo !== "/" ? `?redirect=${encodeURIComponent(returnTo)}` : "";
      window.location.href = `/accept-policy${redirectParam}`;
    }

    return Promise.reject(error);
  }
);

export default api;
