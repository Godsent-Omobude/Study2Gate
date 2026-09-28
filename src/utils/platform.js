import { Capacitor } from "@capacitor/core";

// Used to gate app-only UI (like the post-registration notification
// prompt) so it never shows up for someone just visiting the site in a
// regular browser tab — only for the installed app.
export const isInstalledApp = () => {
  if (typeof window === "undefined") return false;

  // The native Android (Capacitor) app is an installed app too, but its
  // WebView doesn't report display-mode: standalone.
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // Not running under Capacitor — fall through to the PWA checks.
  }

  // Android/desktop Chrome, Edge, and other browsers that support the
  // standard display-mode media query for an installed PWA.
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;

  // iOS Safari has no display-mode support for "Add to Home Screen" apps —
  // it exposes this non-standard flag instead.
  if (window.navigator?.standalone === true) return true;

  return false;
};
