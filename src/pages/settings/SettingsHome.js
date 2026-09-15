import { Link } from "react-router-dom";
import {
  ChevronRight,
  Lock,
  ShieldCheck,
  Palette,
  Bell,
  Trash2,
} from "lucide-react";
import { useSettings } from "./SettingsContext";

const ACCENT_LABELS = {
  blue: "Blue",
  red: "Red",
  purple: "Purple",
  green: "Green",
  yellow: "Yellow",
};

function Row({ to, icon, label, hint, danger }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-800"
      }`}
    >
      <span className={danger ? "text-red-500" : "text-slate-500"}>
        {icon}
      </span>
      <span className="flex-1 font-bold">{label}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
      <ChevronRight size={16} className="text-slate-400" />
    </Link>
  );
}

function Group({ title, children, danger }) {
  return (
    <div className="mb-5">
      <p className="mb-2 ml-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div
        className={`divide-y overflow-hidden rounded-2xl border bg-white ${
          danger
            ? "divide-red-100 border-red-200"
            : "divide-slate-100 border-slate-200"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function SettingsHome() {
  const { settings, profilePictureUrl } = useSettings();

  return (
    <div>
      <Link
        to="/settings/account"
        className="mb-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm hover:bg-slate-50"
      >
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt="Profile"
            className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--accent-soft)]"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-black text-white">
            {(settings.fullName?.[0] || settings.username?.[0] || "S").toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-slate-900">
            {settings.fullName || settings.username}
          </p>
          <p className="truncate text-sm text-slate-500">
            {settings.email} · edit profile
          </p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-slate-400" />
      </Link>

      <Group title="Account">
        <Row
          to="/settings/password"
          icon={<Lock size={18} />}
          label="Password and security"
        />
        <Row
          to="/settings/privacy"
          icon={<ShieldCheck size={18} />}
          label="Privacy"
        />
      </Group>

      <Group title="Preferences">
        <Row
          to="/settings/appearance"
          icon={<Palette size={18} />}
          label="Appearance"
          hint={`${settings.theme === "system" ? "System" : settings.theme}, ${
            ACCENT_LABELS[settings.accentColor] || "Blue"
          }`}
        />
        <Row
          to="/settings/notifications"
          icon={<Bell size={18} />}
          label="Notifications"
        />
      </Group>

      <Group title="Danger zone" danger>
        <Row
          to="/settings/danger"
          icon={<Trash2 size={18} />}
          label="Delete account"
          danger
        />
      </Group>
    </div>
  );
}
