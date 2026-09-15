import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import { Eye, EyeOff } from "lucide-react";
import PasswordRequirementsChecklist from "../components/PasswordRequirementsChecklist";
import PushNotificationSettings from "../components/PushNotificationSettings";
import { isPasswordValid } from "../utils/passwordRequirements";
import { resolveTheme } from "../utils/theme";

const themes = ["light", "dark", "system"];
const accents = [
  { id: "blue", label: "Blue", symbol: "🔵" },
  { id: "red", label: "Red", symbol: "🔴" },
  { id: "purple", label: "Purple", symbol: "🟣" },
  { id: "green", label: "Green", symbol: "🟢" },
  { id: "yellow", label: "Yellow", symbol: "🟡" },
];

const applyAppearance = (theme, accentColor) => {
  const root = document.documentElement;
  // The stored preference can be "system" — resolveTheme turns that into
  // the actual "light"/"dark" the CSS knows how to style (see
  // utils/theme.js). localStorage still keeps the raw preference so the
  // picker below shows "System default" as selected, and so
  // AppearanceManager can re-resolve it if the OS preference changes.
  root.dataset.theme = resolveTheme(theme);
  root.dataset.accent = accentColor;
  localStorage.setItem("theme", theme);
  localStorage.setItem("accentColor", accentColor);
  window.dispatchEvent(new Event("study2gate-appearance-change"));
};

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const showMessage = (text) => {
    setError("");
    setMessage(text);
  };

  const showError = (text) => {
    setMessage("");
    setError(text);
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
        setFullName(user.fullName || "");
        setMatricNumber(user.matricNumber || "");
        syncLocalStorage(user);
        applyAppearance(user.theme || "system", user.accentColor || "blue");
        if (user.profilePicture) await loadProfilePicture();
      } catch (err) {
        showError(err.response?.data?.message || "Unable to load settings.");
      }
    };

    load();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.patch("/settings/profile", {
        fullName,
        matricNumber,
      });
      setSettings(response.data);
      syncLocalStorage(response.data);
      showMessage("Profile details saved.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadProfilePicture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      setSaving(true);
      const response = await api.post("/settings/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSettings(response.data);
      syncLocalStorage(response.data);
      await loadProfilePicture();
      window.dispatchEvent(new Event("study2gate-profile-picture-updated"));
      showMessage("Profile picture updated.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to update profile picture.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const removeProfilePicture = async () => {
    try {
      setSaving(true);
      const response = await api.delete("/settings/profile-picture");
      setSettings(response.data);
      syncLocalStorage(response.data);
      setProfilePictureUrl("");
      window.dispatchEvent(new Event("study2gate-profile-picture-updated"));
      showMessage("Profile picture removed.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to remove profile picture.");
    } finally {
      setSaving(false);
    }
  };

  const saveAppearance = async (field, value) => {
    try {
      const response = await api.patch("/settings/appearance", { [field]: value });
      setSettings(response.data);
      syncLocalStorage(response.data);
      applyAppearance(response.data.theme, response.data.accentColor);
      showMessage("Appearance updated.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to save appearance.");
    }
  };

  const savePrivacy = async (value) => {
    try {
      const response = await api.patch("/settings/privacy", {
        showUsernameOnMaterials: value,
      });
      setSettings(response.data);
      syncLocalStorage(response.data);
      showMessage("Privacy setting updated.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to save privacy setting.");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (!isPasswordValid(newPassword)) {
      showError("New password does not meet the requirements below.");
      return;
    }

    try {
      setSaving(true);
      await api.patch("/settings/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      showMessage("Password changed successfully.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to change password.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (event) => {
    event.preventDefault();

    if (deleteConfirmation !== "I agree to delete my account") {
      showError('Type exactly "I agree to delete my account".');
      return;
    }

    if (!window.confirm("This permanently deletes your Study2Gate account. Continue?")) {
      return;
    }

    try {
      setSaving(true);
      await api.delete("/settings/account", {
        data: {
          confirmation: deleteConfirmation,
          password: deletePassword,
        },
      });

      localStorage.clear();
      window.location.href = "/register";
    } catch (err) {
      showError(err.response?.data?.message || "Unable to delete account.");
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          Loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your Study2Gate account and preferences.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Profile picture</h2>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--accent-soft)]" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent)] text-3xl font-black text-white">
                {(settings.fullName?.[0] || "S").toUpperCase()}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={uploadProfilePicture}
              />
              <button onClick={() => fileInputRef.current?.click()} disabled={saving} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white">
                {settings.profilePicture ? "Change" : "Upload"}
              </button>
              {settings.profilePicture && (
                <button onClick={removeProfilePicture} disabled={saving} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600">
                  Remove
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Account</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700">Email address</label>
              <input value={settings.email || ""} readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600" />
              <p className="mt-1 text-xs text-slate-400">Email is view-only.</p>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Username</label>
              <input value={settings.username || ""} readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600" />
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">
                Matriculation number <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
            </div>
            <button disabled={saving} className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white">
              Save profile
            </button>
          </form>
        </section>

        <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Password</h2>
          <form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <input type={showCurrentPassword ? "text" : "password"} required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-[var(--accent)]" />
              <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700" aria-label={showCurrentPassword ? "Hide password" : "Show password"}>
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <input type={showNewPassword ? "text" : "password"} required minLength={12} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onFocus={() => setNewPasswordFocused(true)} placeholder="New password" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-[var(--accent)]" />
              <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700" aria-label={showNewPassword ? "Hide password" : "Show password"}>
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {newPasswordFocused && (
                <PasswordRequirementsChecklist password={newPassword} />
              )}
            </div>
            <button disabled={saving || !isPasswordValid(newPassword)} className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
              Change password
            </button>
          </form>
        </section>

        <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Privacy</h2>
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="font-bold text-slate-800">Show username on uploaded materials</p>
              <p className="mt-1 text-xs text-slate-500">
                When disabled, your username is hidden from material listings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showUsernameOnMaterials}
              onChange={(e) => savePrivacy(e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
          </label>
        </section>

        <PushNotificationSettings />

        <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Appearance</h2>

          <div className="mt-5">
            <p className="mb-3 text-sm font-bold text-slate-700">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => saveAppearance("theme", theme)}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize ${
                    settings.theme === theme
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {theme === "system" ? "System default" : theme}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-slate-700">Accent colour</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {accents.map((accent) => (
                <button
                  key={accent.id}
                  onClick={() => saveAppearance("accentColor", accent.id)}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                    settings.accentColor === accent.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="mr-1">{accent.symbol}</span>{accent.label}
                  {accent.id === "blue" && <span className="ml-1 text-xs text-slate-400">(default)</span>}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-black text-red-800">Account deletion</h2>
          <p className="mt-2 text-sm leading-6 text-red-700">
            This permanently deletes your account, flashcards, uploaded-material records and stored profile picture.
          </p>
          <form onSubmit={deleteAccount} className="mt-5 space-y-4">
            <input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="I agree to delete my account"
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
            />
            <div className="relative">
              <input
                type={showDeletePassword ? "text" : "password"}
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => setShowDeletePassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showDeletePassword ? "Hide password" : "Show password"}
              >
                {showDeletePassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              disabled={saving}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"
            >
              Confirm deletion
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
