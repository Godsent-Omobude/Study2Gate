import { useEffect, useState } from "react";
import {
  getPermissionState,
  requestPermissionAndRegister,
  revokeLocalToken,
} from "../firebase/messaging";
import {
  registerPushDevice,
  unregisterPushDevice,
  getPushStatus,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../api/pushNotifications";

const CATEGORIES = {
  notifyCircleMessages: { label: "Messages", description: "New messages in your Study Circles when you're not actively viewing them." },
  notifyCircleInvitations: { label: "Invitations", description: "When someone invites you to join a Study Circle." },
  notifyMentions: { label: "Mentions", description: "When someone mentions you directly." },
  notifyCircleActivity: { label: "Activity", description: "Join requests, approvals, new sessions and membership changes." },
  notifyFlashcardActivity: { label: "Flashcard activity", description: "Updates about your flashcard sets." },
  notifyAccountSecurity: { label: "Account and security", description: "Important alerts about your account." },
  notifyAnnouncements: { label: "Announcements", description: "Occasional platform news and updates." },
};

const GROUPS = [
  {
    title: "Study circles",
    keys: ["notifyCircleMessages", "notifyCircleInvitations", "notifyMentions", "notifyCircleActivity"],
  },
  { title: "Flashcards", keys: ["notifyFlashcardActivity"] },
  { title: "Account and general", keys: ["notifyAccountSecurity", "notifyAnnouncements"] },
];

const STATUS_COPY = {
  unsupported: { label: "Unsupported", tone: "text-slate-500 bg-slate-100" },
  denied: { label: "Blocked by browser", tone: "text-red-700 bg-red-100" },
  "not-requested": { label: "Disabled", tone: "text-slate-600 bg-slate-100" },
  granted: { label: "Enabled", tone: "text-emerald-700 bg-emerald-100" },
};

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-[var(--accent)]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function PushNotificationSettings() {
  const [permission, setPermission] = useState(() => getPermissionState());
  const [activeDeviceCount, setActiveDeviceCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshStatus = async () => {
    try {
      const { data } = await getPushStatus();
      setActiveDeviceCount(data.activeDeviceCount || 0);
    } catch {
      // Non-fatal — the permission-state UI still works without this.
    }
  };

  useEffect(() => {
    refreshStatus();
    getNotificationPreferences()
      .then(({ data }) => setPreferences(data))
      .catch(() => setError("Unable to load notification preferences."));
  }, []);

  const enabledOnThisDevice = permission === "granted" && Boolean(localStorage.getItem("fcmToken")) && activeDeviceCount > 0;

  const handleEnable = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await requestPermissionAndRegister();
      setPermission(result.permission);

      if (result.permission !== "granted") {
        if (result.permission === "denied") {
          setError("Notifications are blocked. Enable them in your browser's site settings to turn this on.");
        }
        return;
      }

      await registerPushDevice(result.token, result.deviceInfo);
      localStorage.setItem("fcmToken", result.token);
      await refreshStatus();
      setNotice("Notifications enabled on this device.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to enable notifications.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const token = localStorage.getItem("fcmToken");
      if (token) {
        await unregisterPushDevice(token).catch(() => {});
      }
      await revokeLocalToken();
      localStorage.removeItem("fcmToken");
      await refreshStatus();
      setNotice("Notifications turned off on this device.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to disable notifications.");
    } finally {
      setBusy(false);
    }
  };

  const toggleCategory = async (key, value) => {
    setError("");
    const previous = preferences;
    setPreferences((prefs) => ({ ...prefs, [key]: value }));
    try {
      const { data } = await updateNotificationPreferences({ [key]: value });
      setPreferences(data);
    } catch (err) {
      setPreferences(previous);
      setError(err.response?.data?.message || "Unable to save notification preference.");
    }
  };

  const statusCopy = STATUS_COPY[permission] || STATUS_COPY["not-requested"];

  return (
    <section className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-900">Notifications</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusCopy.tone}`}>
          {statusCopy.label}
        </span>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      {notice && <p className="mt-3 text-sm font-semibold text-emerald-600">{notice}</p>}

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        {permission === "unsupported" && (
          <p className="text-sm text-slate-500">
            Notifications aren't supported in this browser. Try a recent version of Chrome, Firefox, or Edge.
          </p>
        )}

        {permission === "denied" && (
          <p className="text-sm text-slate-600">
            You've blocked notifications for Study2Gate. To turn them back on, allow notifications for this
            site in your browser's settings, then reload this page.
          </p>
        )}

        {(permission === "not-requested" || permission === "granted") && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-800">Browser notifications</p>
              <p className="mt-1 text-xs text-slate-500">
                Get notified on this device even when Study2Gate isn't open in your browser.
              </p>
            </div>
            {enabledOnThisDevice ? (
              <button
                onClick={handleDisable}
                disabled={busy}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-60"
              >
                Turn off
              </button>
            ) : (
              <button
                onClick={handleEnable}
                disabled={busy}
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                Enable notifications
              </button>
            )}
          </div>
        )}
      </div>

      {preferences && (
        <div className="mt-5">
          <p className="text-sm font-bold text-slate-700">Notify me about</p>
          {!enabledOnThisDevice && (
            <p className="mt-1 text-xs text-slate-400">
              Enable browser notifications above to turn these on.
            </p>
          )}

          {GROUPS.map((group) => (
            <div key={group.title} className="mt-4">
              <p className="mb-2 ml-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                {group.title}
              </p>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                {group.keys.map((key) => {
                  const category = CATEGORIES[key];
                  return (
                    <div key={key} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{category.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{category.description}</p>
                      </div>
                      <Toggle
                        checked={Boolean(preferences[key])}
                        onChange={(value) => toggleCategory(key, value)}
                        label={category.label}
                        disabled={!enabledOnThisDevice}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="pt-3 text-xs text-slate-400">
            These control which notifications can be sent as browser push. Turning a category off doesn't
            affect your in-app notification bell.
          </p>
        </div>
      )}
    </section>
  );
}
