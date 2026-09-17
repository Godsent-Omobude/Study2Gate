import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../../api/api";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [adminInfo, setAdminInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  const showMessage = useCallback((text) => {
    setError("");
    setMessage(text);
  }, []);

  const showError = useCallback((text) => {
    setMessage("");
    setError(text);
  }, []);

  const handleApiError = useCallback((err, fallback) => {
    console.error(err);

    if (err.response?.status === 401) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("role");
      window.location.href = "/login";
      return;
    }

    if (err.response?.status === 403) {
      setError("Access denied. Your account is no longer an administrator.");
      return;
    }

    setError(err.response?.data?.message || fallback);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data.stats);
      setRecentUsers(res.data.recentUsers || []);
      setRecentFiles(res.data.recentFiles || []);
    } catch (err) {
      handleApiError(err, "Unable to load administrator statistics.");
    }
  }, [handleApiError]);

  // Not a second access check — AdminRoute already verified admin access
  // (and showed its own "Verifying administrator access..." screen) before
  // this provider was allowed to mount. This just fetches this page's own
  // admin profile card, so it runs in the background rather than blocking
  // the first paint.
  const verifyAdmin = useCallback(async () => {
    try {
      const res = await api.get("/admin/check");
      setAdminInfo(res.data.user);
    } catch (err) {
      handleApiError(err, "Unable to verify administrator access.");
    }
  }, [handleApiError]);

  useEffect(() => {
    verifyAdmin();

    (async () => {
      try {
        await loadStats();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = {
    adminInfo,
    stats,
    recentUsers,
    recentFiles,
    loading,
    actionLoading,
    setActionLoading,
    message,
    error,
    clearMessages,
    showMessage,
    showError,
    handleApiError,
    loadStats,
    verifyAdmin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}
