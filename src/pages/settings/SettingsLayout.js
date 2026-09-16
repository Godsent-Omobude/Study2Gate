import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { SettingsProvider, useSettings } from "./SettingsContext";

const TITLES = {
  "/settings": "Settings",
  "/settings/account": "Account",
  "/settings/password": "Password and security",
  "/settings/privacy": "Privacy",
  "/settings/standing": "Account standing",
  "/settings/appearance": "Appearance",
  "/settings/notifications": "Notifications",
  "/settings/devices": "Devices",
  "/settings/danger": "Delete account",
};

function SettingsShell() {
  const { settings, message, error } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/settings";
  const title = TITLES[location.pathname] || "Settings";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-2">
          {!isHome && (
            <button
              onClick={() => navigate("/settings")}
              aria-label="Back to settings"
              className="-ml-1.5 rounded-full p-1.5 text-slate-500 hover:bg-slate-200"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-black text-slate-900">{title}</h1>
            {isHome && (
              <p className="mt-1 text-sm text-slate-500">
                Manage your Study2Gate account and preferences.
              </p>
            )}
          </div>
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

        {!settings ? (
          <div className="rounded-3xl bg-white p-8 text-slate-500 shadow-sm">
            Loading settings...
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </main>
  );
}

export default function SettingsLayout() {
  return (
    <SettingsProvider>
      <SettingsShell />
    </SettingsProvider>
  );
}
