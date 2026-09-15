import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../api/api";
import { createStudySocket, disconnectStudySocket } from "../api/socket";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const notificationIdsRef = useRef(new Set());
  const navigate = useNavigate();

  const load = async () => {
    try {
      const response = await api.get("/notifications");
      const list = response.data?.notifications || [];
      notificationIdsRef.current = new Set(list.map((item) => item.id));
      setNotifications(list);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    load();
    const socket = createStudySocket();
    socket.on("notification:new", (notification) => {
      const exists = notificationIdsRef.current.has(notification.id);
      notificationIdsRef.current.add(notification.id);
      setNotifications((current) => exists ? current.map((item) => item.id === notification.id ? notification : item) : [notification, ...current].slice(0, 50));
      if (!exists && !notification.read) setUnreadCount((count) => count + 1);
    });
    const close = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => { disconnectStudySocket(); document.removeEventListener("mousedown", close); };
  }, []);

  const markRead = async (notification) => {
    if (!notification.read) {
      setNotifications((current) => current.map((n) => n.id === notification.id ? { ...n, read: true } : n));
      setUnreadCount((count) => Math.max(0, count - 1));
      try { await api.patch(`/notifications/${notification.id}/read`); } catch { /* keep optimistic state */ }
    }
    setOpen(false);
    if (notification.circle?.id) navigate(`/circles/${notification.circle.id}`);
  };

  const markAllRead = async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await api.patch("/notifications/read-all"); } catch { /* keep optimistic state */ }
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-16 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div><p className="font-black text-slate-900">Notifications</p><p className="text-xs text-slate-400">{unreadCount} unread</p></div>
            <button type="button" onClick={markAllRead} disabled={!unreadCount} className="text-xs font-bold text-violet-600 disabled:text-slate-300">Mark all read</button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">You're all caught up.</p> : notifications.map((n) => (
              <button key={n.id} type="button" onClick={() => markRead(n)} className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${n.read ? "bg-white" : "bg-violet-50/50"}`}>
                <div className="flex items-start gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-slate-200" : "bg-violet-600"}`} /><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{n.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{n.body}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</p></div></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
