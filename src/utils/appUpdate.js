import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import api from "../api/api";

// Update detection for the native Android app. The installed version comes
// from the app itself (App.getInfo), the newest version from the backend's
// public GET /api/app-version (see backend/routes/appVersion.js). Versions
// are compared by Android versionCode — an integer that must go up with
// every APK you release (android/app/build.gradle -> versionCode).
//
// Everything here is a no-op in a regular browser, and in an APK built
// before @capacitor/app was added (isPluginAvailable guards that case).

const DISMISS_KEY = "appUpdateDismissed";
const SNOOZE_MS = 24 * 60 * 60 * 1000; // "Later" hides that version for a day

export const canCheckForAppUpdate = () => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("App");
  } catch {
    return false;
  }
};

const isSnoozed = (versionCode) => {
  try {
    const saved = JSON.parse(localStorage.getItem(DISMISS_KEY));
    return Boolean(saved) && saved.versionCode === versionCode && Date.now() - saved.at < SNOOZE_MS;
  } catch {
    return false;
  }
};

export const snoozeAppUpdate = (versionCode) => {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ versionCode, at: Date.now() }));
  } catch {
    // Storage unavailable — the prompt just shows again next launch.
  }
};

// Resolves to null when there's nothing to show (up to date, feature not
// configured, snoozed, offline, ...), otherwise the details for the prompt.
// Never throws: a failed check must never get in the way of using the app.
export const checkForAppUpdate = async () => {
  if (!canCheckForAppUpdate()) return null;

  try {
    const [info, response] = await Promise.all([App.getInfo(), api.get("/app-version")]);
    const installed = parseInt(info?.build, 10);
    const data = response?.data;
    if (!Number.isFinite(installed) || !data?.configured) return null;

    const force = Boolean(data.minVersionCode) && installed < data.minVersionCode;
    const available = installed < data.latestVersionCode;
    if (!force && !available) return null;
    if (!force && isSnoozed(data.latestVersionCode)) return null;

    return {
      force,
      latestVersionCode: data.latestVersionCode,
      latestVersionName: data.latestVersionName,
      releaseNotes: data.releaseNotes,
      downloadUrl: data.downloadUrl,
    };
  } catch {
    return null;
  }
};

export const isValidUpdateLink = (url) => typeof url === "string" && url.startsWith("https://");

export const openUpdateLink = async (url) => {
  if (!isValidUpdateLink(url)) return;
  try {
    if (Capacitor.isPluginAvailable("Browser")) {
      await Browser.open({ url });
      return;
    }
  } catch {
    // Fall through to a plain window.open.
  }
  window.open(url, "_blank", "noopener");
};
