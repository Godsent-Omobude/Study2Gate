import { useRef, useState } from "react";
import api from "../../api/api";
import { useSettings } from "./SettingsContext";

export default function SettingsAccount() {
  const {
    settings,
    setSettings,
    profilePictureUrl,
    loadProfilePicture,
    showMessage,
    showError,
    saving,
    setSaving,
  } = useSettings();
  const [fullName, setFullName] = useState(settings.fullName || "");
  const [matricNumber, setMatricNumber] = useState(settings.matricNumber || "");
  const fileInputRef = useRef(null);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.patch("/settings/profile", {
        fullName,
        matricNumber,
      });
      setSettings(response.data);
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
      window.dispatchEvent(new Event("study2gate-profile-picture-updated"));
      showMessage("Profile picture removed.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to remove profile picture.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Profile picture</h2>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--accent-soft)]"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent)] text-3xl font-black text-white">
              {(settings.fullName?.[0] || settings.username?.[0] || "S").toUpperCase()}
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
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white"
            >
              {settings.profilePicture ? "Change" : "Upload"}
            </button>
            {settings.profilePicture && (
              <button
                onClick={removeProfilePicture}
                disabled={saving}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Account details</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-email" className="text-sm font-bold text-slate-700">
              Email address
            </label>
            <input
              id="settings-email"
              value={settings.email || ""}
              readOnly
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-400">Email is view-only.</p>
          </div>

          <div>
            <label htmlFor="settings-username" className="text-sm font-bold text-slate-700">
              Username
            </label>
            <input
              id="settings-username"
              value={settings.username || ""}
              readOnly
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
            />
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-fullname" className="text-sm font-bold text-slate-700">
              Full name
            </label>
            <input
              id="settings-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="settings-matric" className="text-sm font-bold text-slate-700">
              Matriculation number <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              id="settings-matric"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            disabled={saving}
            className="w-fit rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white sm:col-span-2"
          >
            Save profile
          </button>
        </form>
      </section>
    </div>
  );
}
