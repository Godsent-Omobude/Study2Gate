import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  refreshTokenIfPermitted,
  listenForForegroundMessages,
  listenForNotificationTaps,
} from "../firebase/messaging";
import { registerPushDevice } from "../api/pushNotifications";

// Mounted once per authenticated session (see Sidebar.js, which is present
// on every protected page). Two responsibilities:
//
// 1. On load, silently re-confirms the FCM token if the user previously
//    enabled notifications and permission is still granted. FCM tokens can
//    rotate; without this, a rotated token would go stale and the user
//    would stop receiving pushes without any visible error.
// 2. Subscribes to foreground messages purely so the Firebase SDK has a
//    registered handler (avoids console warnings) — deliberately does NOT
//    show a native notification while a tab is open/focused, since the
//    existing Socket.IO "notification:new" event already updates the
//    NotificationBell in real time. Background/closed-tab notifications
//    are handled entirely by public/sw.js (the app's merged service worker;
//    see scripts/generate-firebase-sw.js).
export default function usePushMessaging() {
  const navigate = useNavigate();

  // The service worker's notificationclick handler focuses an existing
  // tab and tries client.navigate() directly; in browsers where that's
  // restricted it falls back to postMessage instead (see
  // scripts/generate-firebase-sw.js). This listener is what makes that
  // fallback actually move the already-loaded React app to the right page
  // via the client-side router, instead of a full page load.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    const onMessage = (event) => {
      if (event.data?.type === "push-notification-click" && event.data?.url) {
        navigate(event.data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  // Native app: tapping a notification (while the app is backgrounded or
  // was closed) opens the page the backend attached to it.
  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    listenForNotificationTaps((url) => navigate(url)).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    const syncToken = async () => {
      const previousToken = localStorage.getItem("fcmToken");
      const refreshed = await refreshTokenIfPermitted();
      if (cancelled || !refreshed) return;

      if (!previousToken || refreshed.token !== previousToken) {
        try {
          await registerPushDevice(refreshed.token, refreshed.deviceInfo);
          localStorage.setItem("fcmToken", refreshed.token);
        } catch (error) {
          console.warn("Unable to refresh push registration:", error.message);
        }
      }
    };

    syncToken();

    listenForForegroundMessages((payload) => {
      // Intentionally no-op UI-wise — see comment above.
      console.debug("Foreground push received:", payload?.data?.type);
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}
