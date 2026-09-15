import api from "../../api/api";
import { useSettings } from "./SettingsContext";

export default function SettingsPrivacy() {
  const { settings, setSettings, showMessage, showError } = useSettings();

  const savePrivacy = async (value) => {
    try {
      const response = await api.patch("/settings/privacy", {
        showUsernameOnMaterials: value,
      });
      setSettings(response.data);
      showMessage("Privacy setting updated.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to save privacy setting.");
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
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
  );
}
