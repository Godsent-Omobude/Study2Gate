import api from "../../api/api";
import { useSettings, applyAppearance } from "./SettingsContext";

const themes = ["light", "dark", "system"];
// "blue" is the stored id of the default accent (kept so saved settings and the
// backend keep working); it is now the Study2Gate teal.
const accents = [
  { id: "blue", label: "Teal", color: "#0b4a50" },
  { id: "royalblue", label: "Blue", color: "#1464d2" },
  { id: "red", label: "Red", color: "#dc2626" },
  { id: "purple", label: "Purple", color: "#7c3aed" },
  { id: "green", label: "Green", color: "#16a34a" },
  { id: "yellow", label: "Yellow", color: "#ca8a04" },
];

export default function SettingsAppearance() {
  const { settings, setSettings, showMessage, showError } = useSettings();

  const saveAppearance = async (field, value) => {
    try {
      const response = await api.patch("/settings/appearance", { [field]: value });
      setSettings(response.data);
      applyAppearance(response.data.theme, response.data.accentColor);
      showMessage("Appearance updated.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to save appearance.");
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div>
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full align-middle ring-1 ring-slate-300"
                style={{ backgroundColor: accent.color }}
              />
              {accent.label}
              {accent.id === "blue" && (
                <span className="ml-1 text-xs text-slate-400">(default)</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
