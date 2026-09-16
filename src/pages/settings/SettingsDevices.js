import { useEffect, useState } from "react";
import { listPushDevices, removePushDevice } from "../../api/pushNotifications";
import { refreshTokenIfPermitted } from "../../firebase/messaging";
import { useSettings } from "./SettingsContext";

const formatRelative = (value) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function SettingsDevices() {
  const { showMessage, showError } = useSettings();
  const [devices, setDevices] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [devicesResponse, tokenResult] = await Promise.all([
          listPushDevices(),
          // Only resolves to a token if this browser already has
          // notification permission granted — otherwise null, and no
          // row gets marked "This device" (there's nothing to compare).
          refreshTokenIfPermitted().catch(() => null),
        ]);
        setDevices(devicesResponse.data.devices || []);
        setCurrentToken(tokenResult?.token || null);
      } catch (err) {
        showError(err.response?.data?.message || "Unable to load your devices.");
        setDevices([]);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (device) => {
    setRemovingId(device.id);
    try {
      await removePushDevice(device.id);
      setDevices((current) => current.filter((item) => item.id !== device.id));
      showMessage("Device removed.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to remove that device.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Devices</h2>
      <p className="mt-2 text-sm text-slate-500">
        Browsers and devices registered to receive push notifications for your account.
        Remove any you no longer use or recognize.
      </p>

      <div className="mt-5 space-y-3">
        {devices === null && (
          <p className="text-sm text-slate-400">Loading devices...</p>
        )}

        {devices !== null && devices.length === 0 && (
          <p className="text-sm text-slate-400">
            No devices are currently registered for push notifications.
          </p>
        )}

        {devices?.map((device) => {
          const isThisDevice = Boolean(currentToken) && device.token === currentToken;
          return (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-800 truncate">
                    {device.deviceInfo || "Unknown device"}
                  </p>
                  {isThisDevice && (
                    <span className="text-[10px] font-black uppercase text-[var(--accent)]">
                      This device
                    </span>
                  )}
                  {!device.active && (
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Last used {formatRelative(device.lastUsedAt)}
                </p>
              </div>

              <button
                onClick={() => handleRemove(device)}
                disabled={removingId === device.id}
                className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removingId === device.id ? "Removing..." : "Remove"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
