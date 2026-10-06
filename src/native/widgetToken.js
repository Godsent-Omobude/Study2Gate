import { registerPlugin, Capacitor } from "@capacitor/core";
import api from "../api/api";

// Local native-only plugin — not installed via npm, so it's registered
// directly by name here rather than imported from a package. Matches the
// name in WidgetTokenPlugin.java's @CapacitorPlugin(name = "WidgetToken").
const WidgetToken = registerPlugin("WidgetToken");

// Call this once, right after a successful login — fetches the long-lived
// widget-read token from the backend (see backend/routes/widget.js) and
// hands it to native code to store for the home-screen widget. No-ops on
// web, since there is no home-screen widget there.
export async function saveWidgetToken() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const response = await api.post("/widget/token");
    const token = response.data?.token;

    if (token) {
      await WidgetToken.saveToken({ token });
    }
  } catch (error) {
    // Non-fatal — the widget simply won't have fresh data until the next
    // successful login. Never block/interrupt the login flow over this.
    console.error("Failed to save widget token:", error);
  }
}

// Call this on logout so a stale token isn't left behind for the next
// person who might use the same device.
export async function clearWidgetToken() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await WidgetToken.clearToken();
  } catch (error) {
    console.error("Failed to clear widget token:", error);
  }
}
