// Notification-permission flow and FCM token helpers. Nothing in this file
// calls the browser permission prompt on its own — see requestPermissionAndRegister,
// which is only ever called from an explicit user action in
// Settings → Notifications (never on page load).
import { getToken, onMessage, deleteToken } from "firebase/messaging";
import { getMessagingIfSupported, isFirebaseConfigured, vapidKey } from "./config";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

// sw.js is the app's single service worker — it handles both PWA offline
// caching and Firebase Cloud Messaging background push (see
// scripts/generate-firebase-sw.js for why these had to be merged into one
// file rather than two workers competing for the same "/" scope). It's
// registered unconditionally on app load in src/index.js; this constant
// is reused here so the FCM token request attaches to that same
// registration instead of creating a second one.
const SERVICE_WORKER_URL = "/sw.js";

// --- Native (Capacitor Android) push ------------------------------------
//
// Inside the native Android app the WebView can't do web push (no Push API
// or service-worker push), so the app uses the official Capacitor Push
// Notifications plugin instead: the Android Firebase SDK (configured by
// android/app/google-services.json) hands back a native FCM token, which is
// registered with the backend exactly like a web token. Notifications are
// then delivered by Google Play Services, so they arrive even when the app
// is closed or the user is signed out. Everything native is a no-op in a
// regular browser, and in an older APK that predates the plugin
// (isPluginAvailable guards that), so the web flow below is unchanged.
//
// Must match ANDROID_CHANNEL_ID in backend/services/pushNotificationService.js.
export const NATIVE_CHANNEL_ID = "study2gate_alerts";

export const isNativePushAvailable = () => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications");
  } catch {
    return false;
  }
};

const mapNativePermission = (receive) => {
  if (receive === "granted") return "granted";
  if (receive === "denied") return "denied";
  return "not-requested";
};

const describeNativeDevice = () =>
  `Study2Gate app on ${Capacitor.getPlatform() === "ios" ? "iOS" : "Android"}`;

// Android 8+ requires a notification channel; creating an existing channel
// is a harmless no-op, so this is safe to call on every launch. High
// importance = sound + heads-up banner, appropriate for streak warnings
// and chat messages.
let nativeChannelReady = false;
const ensureNativeChannel = async () => {
  if (nativeChannelReady) return;
  try {
    await PushNotifications.createChannel({
      id: NATIVE_CHANNEL_ID,
      name: "Study2Gate alerts",
      description: "Streak reminders, Study Circle messages and other time-sensitive alerts",
      importance: 4,
      visibility: 1,
      vibration: true,
    });
    nativeChannelReady = true;
  } catch (error) {
    console.warn("Unable to create notification channel:", error?.message);
  }
};

// Asks the plugin to register with FCM and resolves with the device token
// (or rejects on failure/timeout).
const registerNativeAndGetToken = async () => {
  let resolveToken;
  let rejectToken;
  const tokenPromise = new Promise((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
  });

  const tokenListener = await PushNotifications.addListener("registration", (token) =>
    resolveToken(token.value)
  );
  const errorListener = await PushNotifications.addListener("registrationError", (err) =>
    rejectToken(new Error(err?.error || "Push registration failed."))
  );
  const timer = setTimeout(
    () => rejectToken(new Error("Timed out waiting for the push registration token.")),
    15000
  );

  try {
    await PushNotifications.register();
    return await tokenPromise;
  } finally {
    clearTimeout(timer);
    tokenListener.remove();
    errorListener.remove();
  }
};

// One of: "unsupported" | "not-requested" | "granted" | "denied"
//
// Synchronous, so in the native app it can only return a placeholder — use
// getPermissionStateAsync() where the real OS permission matters.
export const getPermissionState = () => {
  if (isNativePushAvailable()) return "not-requested";
  if (!isFirebaseConfigured()) return "unsupported";
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "not-requested";
};

// Same values as getPermissionState(), but reads the real OS permission
// when running inside the native app.
export const getPermissionStateAsync = async () => {
  if (isNativePushAvailable()) {
    try {
      const status = await PushNotifications.checkPermissions();
      return mapNativePermission(status.receive);
    } catch {
      return "unsupported";
    }
  }
  return getPermissionState();
};

const registerServiceWorker = async () => {
  // index.js already registers sw.js unconditionally on app load (for PWA
  // installability, independent of notification permission). Calling
  // register() again here with the same script URL/scope doesn't create a
  // second worker — the browser resolves it to that same registration —
  // but doing it explicitly here too means this call can still be awaited
  // before requesting an FCM token, even if index.js's registration
  // hasn't settled yet.
  return navigator.serviceWorker.register(SERVICE_WORKER_URL, { updateViaCache: "none" });
};

const describeDevice = () => {
  const ua = navigator.userAgent || "";
  let browser = "Browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  let os = "device";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "Mac";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} on ${os}`;
};

// The full opt-in flow: requests browser permission (must be called from a
// user gesture triggered by an explicit "Enable notifications" action —
// see Settings), registers the service worker, and obtains the current FCM
// token. Does NOT talk to the Study2Gate backend — the caller is
// responsible for sending the returned token to POST /notifications/register.
export const requestPermissionAndRegister = async () => {
  if (isNativePushAvailable()) {
    let status = await PushNotifications.checkPermissions();
    if (status.receive !== "granted") {
      // Android 13+ shows the system permission dialog here.
      status = await PushNotifications.requestPermissions();
    }
    const permission = mapNativePermission(status.receive);
    if (permission !== "granted") return { permission, token: null };

    await ensureNativeChannel();
    const token = await registerNativeAndGetToken();
    return { permission, token, deviceInfo: describeNativeDevice() };
  }

  if (!isFirebaseConfigured()) {
    throw new Error("Notifications are not configured for this deployment.");
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    throw new Error("Notifications aren't supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { permission, token: null };
  }

  const registration = await registerServiceWorker();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Unable to obtain a push registration token.");
  }

  return { permission, token, deviceInfo: describeDevice() };
};

// Re-confirms/refreshes the current token for a user who previously
// enabled notifications and already granted permission — used on app load
// so a rotated FCM token stays registered without asking for permission
// again. Resolves to null if permission isn't already granted, silently
// (this is a background refresh, not a user-initiated action).
export const refreshTokenIfPermitted = async () => {
  if (isNativePushAvailable()) {
    try {
      const status = await PushNotifications.checkPermissions();
      if (status.receive !== "granted") return null;
      await ensureNativeChannel();
      const token = await registerNativeAndGetToken();
      return token ? { token, deviceInfo: describeNativeDevice() } : null;
    } catch (error) {
      console.warn("Native push token refresh failed:", error.message);
      return null;
    }
  }

  if (getPermissionState() !== "granted") return null;
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return null;
    const registration = await registerServiceWorker();
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    return token ? { token, deviceInfo: describeDevice() } : null;
  } catch (error) {
    console.warn("Push token refresh failed:", error.message);
    return null;
  }
};

// Best-effort local + FCM-side cleanup when the user disables notifications
// from Settings. The caller is still responsible for telling the backend
// via DELETE /notifications/unregister.
export const revokeLocalToken = async () => {
  try {
    if (isNativePushAvailable()) {
      await PushNotifications.unregister();
      return;
    }
    const messaging = await getMessagingIfSupported();
    if (messaging) await deleteToken(messaging);
  } catch {
    // Non-fatal — the backend registration is removed independently.
  }
};

// Foreground messages (tab open and focused) are intentionally NOT shown
// as a native OS notification here — the existing Socket.IO-driven
// NotificationBell already reflects them in real time while the app is
// open, so showing a duplicate system popup on top would be redundant.
// Background/closed-tab notifications are handled entirely by public/sw.js
// instead (see scripts/generate-firebase-sw.js). `callback` is invoked with the
// raw FCM payload for callers that want to react to it further (e.g. a
// lightweight in-app toast).
export const listenForForegroundMessages = async (callback) => {
  if (isNativePushAvailable()) {
    const handle = await PushNotifications.addListener("pushNotificationReceived", callback);
    return () => {
      handle.remove();
    };
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

// Native app only: fires when the user taps a notification (including when
// that tap is what launched the app). `onTap` receives the in-app path the
// backend attached to the notification (e.g. "/circles/12"). On the web the
// service worker's notificationclick handler does this job instead.
export const listenForNotificationTaps = async (onTap) => {
  if (!isNativePushAvailable()) return () => {};
  const handle = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action?.notification?.data?.url;
    if (typeof url === "string" && url.startsWith("/")) onTap(url);
  });
  return () => {
    handle.remove();
  };
};
