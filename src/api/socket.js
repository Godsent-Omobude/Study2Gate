import { io } from "socket.io-client";

const normalizeSocketUrl = (url) => {
  const trimmed = String(url || "").trim().replace(/\/$/, "");
  if (!trimmed) return "https://studyshare-backend-1-vopy.onrender.com";
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
};

let socketInstance = null;

export const createStudySocket = () => {
  if (socketInstance) return socketInstance;

  const isProduction = process.env.NODE_ENV === "production";
  const socketUrl = isProduction
    ? window.location.origin
    : normalizeSocketUrl(
        process.env.REACT_APP_API_URL || "https://studyshare-backend-1-vopy.onrender.com"
      );

  socketInstance = io(socketUrl, {
    // Production Socket.IO goes through the same Vercel origin as the REST
    // API. This keeps the httpOnly auth cookie first-party and avoids sending
    // the browser directly to Render, where that cookie is not scoped.
    withCredentials: true,
    // Vercel's external rewrite reliably proxies HTTP polling. Keep polling
    // in production rather than attempting a WebSocket upgrade that the
    // frontend hosting layer does not terminate itself. Local development
    // can use the normal WebSocket-first transport.
    transports: isProduction ? ["polling"] : ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socketInstance;
};

export const disconnectStudySocket = () => {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
};
