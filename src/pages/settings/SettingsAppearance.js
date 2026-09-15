import api from "../../api/api";
import { useSettings, applyAppearance } from "./SettingsContext";

const themes = ["light", "dark", "system"];
const accents = [
  { id: "blue", label: "Blue", symbol: "🔵" },
  { id: "red", label: "Red", symbol: "🔴" },
  { id: "purple", label: "Purple", symbol: "🟣" },
  { id: "green", label: "Green", symbol: "🟢" },
  { id: "yellow", label: "Yellow", symbol: "🟡" },
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
              <span className="mr-1">{accent.symbol}</span>
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
