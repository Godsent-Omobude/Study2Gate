import { createContext, useContext, useEffect, useState } from "react";
import api from "../../api/api";
import { resolveTheme } from "../../utils/theme";
import useProfilePicture from "../../hooks/useProfilePicture";

const SettingsContext = createContext(null);

// The stored preference can be "system" — resolveTheme turns that into the
// actual "light"/"dark" the CSS knows how to style (see utils/theme.js).
// localStorage still keeps the raw preference so the picker shows "System
// default" as selected, and so AppearanceManager can re-resolve it if the
// OS preference changes.
export const applyAppearance = (theme, accentColor) => {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(theme);
  root.dataset.accent = accentColor;
  localStorage.setItem("theme", theme);
  localStorage.setItem("accentColor", accentColor);
  window.dispatchEvent(new Event("study2gate-appearance-change"));
};

const syncLocalStorage = (user) => {
  localStorage.setItem("fullName", user.fullName || "");
  localStorage.setItem("username", user.username || "");
  localStorage.setItem("email", user.email || "");
  localStorage.setItem("matricNumber", user.matricNumber || "");
  localStorage.setItem("profilePicture", user.profilePicture || "");
  localStorage.setItem("theme", user.theme || "system");
  localStorage.setItem("accentColor", user.accentColor || "blue");
  localStorage.setItem("showUsernameOnMaterials", user.showUsernameOnMaterials ? "true" : "false");
  localStorage.setItem("copyrightWarnings", String(user.copyrightWarnings || 0));
  localStorage.setItem("suspendedUntil", user.suspendedUntil || "");
  localStorage.setItem("suspendedReason", user.suspendedReason || "");
};

// Settings loaded once already leave enough behind in localStorage to paint
// the page instantly on a repeat visit — no need to sit on a loading state
// while we wait on the network again. Returns null the very first time
// someone ever opens Settings (nothing cached yet), in which case the
// loading state below still applies just that once.
const readCachedSettings = () => {
  const username = localStorage.getItem("username");
  if (!username) return null;
  return {
    fullName: localStorage.getItem("fullName") || "",
    username,
    email: localStorage.getItem("email") || "",
    matricNumber: localStorage.getItem("matricNumber") || "",
    profilePicture: localStorage.getItem("profilePicture") || "",
    theme: localStorage.getItem("theme") || "system",
    accentColor: localStorage.getItem("accentColor") || "blue",
    showUsernameOnMaterials: localStorage.getItem("showUsernameOnMaterials") === "true",
    copyrightWarnings: Number(localStorage.getItem("copyrightWarnings") || 0),
    suspendedUntil: localStorage.getItem("suspendedUntil") || null,
    suspendedReason: localStorage.getItem("suspendedReason") || null,
  };
};

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(readCachedSettings);
  const profilePictureUrl = useProfilePicture();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const showMessage = (text) => {
    setError("");
    setMessage(text);
  };

  const showError = (text) => {
    setMessage("");
    setError(text);
  };

  // Every settings sub-page reads/writes through this so localStorage stays
  // in sync no matter which page made the change.
  const setSettings = (user) => {
    setSettingsState(user);
    syncLocalStorage(user);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/settings");
        const user = response.data;
        setSettings(user);
        applyAppearance(user.theme || "system", user.accentColor || "blue");
      } catch (err) {
        // If we already have cached settings on screen, a failed background
        // refresh shouldn't rip the page out from under the user — just
        // leave the cached values showing and surface the error quietly.
        if (!settings) {
          showError(err.response?.data?.message || "Unable to load settings.");
        }
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    settings,
    setSettings,
    profilePictureUrl,
    message,
    error,
    showMessage,
    showError,
    saving,
    setSaving,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
