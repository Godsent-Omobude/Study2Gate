import { createContext, useContext, useEffect, useState } from "react";
import api from "../../api/api";
import { resolveTheme } from "../../utils/theme";

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
};

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
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

  const loadProfilePicture = async () => {
    try {
      const response = await api.get("/settings/profile-picture", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      setProfilePictureUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch {
      setProfilePictureUrl("");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/settings");
        const user = response.data;
        setSettings(user);
        applyAppearance(user.theme || "system", user.accentColor || "blue");
        if (user.profilePicture) await loadProfilePicture();
      } catch (err) {
        showError(err.response?.data?.message || "Unable to load settings.");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    settings,
    setSettings,
    profilePictureUrl,
    loadProfilePicture,
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
