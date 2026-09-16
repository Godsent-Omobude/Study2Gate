import api from "./api";

export const registerPushDevice = (token, deviceInfo) =>
  api.post("/notifications/register", { token, deviceInfo });

export const unregisterPushDevice = (token) =>
  api.delete("/notifications/unregister", { data: { token } });

export const getPushStatus = () => api.get("/notifications/status");

export const listPushDevices = () => api.get("/notifications/devices");

export const removePushDevice = (id) => api.delete(`/notifications/devices/${id}`);

export const getNotificationPreferences = () => api.get("/settings/notifications");

export const updateNotificationPreferences = (updates) =>
  api.patch("/settings/notifications", updates);
