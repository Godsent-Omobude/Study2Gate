import { useCallback, useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Pin, Trash2 } from "lucide-react";
import api from "../api/api";
import { createStudySocket } from "../api/socket";

const mergeMessages = (current, incoming) => {
  const map = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) map.set(message.id, { ...map.get(message.id), ...message });
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
};

export default function CircleChat({ circleId, myRole, onAccessRevoked }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [menuId, setMenuId] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [now, setNow] = useState(Date.now());
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const lastIdRef = useRef(0);
  const myUserId = Number(localStorage.getItem("userId"));
  const myUsername = localStorage.getItem("username") || "";
  const canManage = myRole === "OWNER" || myRole === "MODERATOR";

  const loadMessages = useCallback(async (after) => {
    try {
      const response = await api.get(`/circles/${circleId}/messages`, { params: after ? { after } : {} });
      const list = Array.isArray(response.data) ? response.data : [];
      setMessages((current) => mergeMessages(current, list));
      if (list.length) lastIdRef.current = Math.max(lastIdRef.current, ...list.map((m) => m.id));
    } catch (err) {
      if (!after) setError(err.response?.data?.message || "Unable to load chat.");
    }
  }, [circleId]);

  const loadPinned = useCallback(async () => {
    try { const response = await api.get(`/circles/${circleId}/pinned-messages`); setPinned(response.data || []); } catch { /* non-critical */ }
  }, [circleId]);

  useEffect(() => {
    setMessages([]); lastIdRef.current = 0; loadMessages(); loadPinned();
    const socket = createStudySocket();
    socketRef.current = socket;

    const join = () => {
      setConnectionState("joining");
      socket.emit("circle:join", circleId, (result) => {
        if (!result?.ok) { setConnectionState("error"); setError(result?.message || "Unable to join the real-time chat."); return; }
        setConnectionState("connected");
        if (lastIdRef.current) loadMessages(lastIdRef.current);
      });
    };
    const addMessage = (message) => { setMessages((current) => mergeMessages(current, [message])); lastIdRef.current = Math.max(lastIdRef.current, message.id); };
    const onEdited = (message) => setMessages((current) => mergeMessages(current, [message]));
    const onDeleted = (message) => setMessages((current) => mergeMessages(current, [message]));
    const onPinned = (event) => { setMessages((current) => current.map((m) => m.id === event.messageId ? { ...m, isPinned: true } : m)); loadPinned(); };
    const onUnpinned = (event) => { setMessages((current) => current.map((m) => m.id === event.messageId ? { ...m, isPinned: false } : m)); loadPinned(); };
    const onRemoved = () => onAccessRevoked?.();

    socket.on("connect", join);
    socket.on("disconnect", () => setConnectionState("offline"));
    socket.on("connect_error", (err) => { setConnectionState("error"); setError(err.message || "Real-time connection failed."); });
    socket.on("message:new", addMessage);
    socket.on("message:edited", onEdited);
    socket.on("message:deleted", onDeleted);
    socket.on("message:pinned", onPinned);
    socket.on("message:unpinned", onUnpinned);
    socket.on("circle:access-revoked", onRemoved);
    if (socket.connected) join();

    return () => { socket.emit("circle:leave", circleId); socket.off("connect", join); socket.off("disconnect"); socket.off("connect_error"); socket.off("message:new", addMessage); socket.off("message:edited", onEdited); socket.off("message:deleted", onDeleted); socket.off("message:pinned", onPinned); socket.off("message:unpinned", onUnpinned); socket.off("circle:access-revoked", onRemoved); socketRef.current = null; };
  }, [circleId, loadMessages, loadPinned, onAccessRevoked]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const emitAction = (event, payload, successMessage) => new Promise((resolve, reject) => {
    const socket = socketRef.current;
    if (!socket?.connected) return reject(new Error("Real-time chat is reconnecting. Please try again."));
    socket.emit(event, payload, (result) => {
      if (!result?.ok) return reject(new Error(result?.message || "Operation failed."));
      if (successMessage) setError("");
      resolve(result.data);
    });
  });

  const submit = async (e) => {
    e.preventDefault();
    const clean = content.trim(); if (!clean) return;
    try { await emitAction("message:send", { circleId, content: clean }); setContent(""); }
    catch (err) { setError(err.message); }
  };

  const saveEdit = async () => {
    if (!editing?.content.trim()) return;
    try { await emitAction("message:edit", { circleId, messageId: editing.id, content: editing.content.trim() }); setEditing(null); setMenuId(null); }
    catch (err) { setError(err.message); }
  };

  const deleteMessage = async (messageId) => {
    try { await emitAction("message:delete", { circleId, messageId }); setMenuId(null); }
    catch (err) { setError(err.message); }
  };

  const togglePin = async (message) => {
    try { await emitAction(message.isPinned ? "message:unpin" : "message:pin", { circleId, messageId: message.id }); setMenuId(null); }
    catch (err) { setError(err.message); }
  };

  const canEdit = (message) => (message.userId === myUserId || (Number.isNaN(myUserId) && message.username === myUsername)) && !message.deletedAt && now - new Date(message.createdAt).getTime() <= 5 * 60 * 1000;
  const canDelete = (message) => (message.userId === myUserId || (Number.isNaN(myUserId) && message.username === myUsername)) ? !message.deletedAt && now - new Date(message.createdAt).getTime() <= 12 * 60 * 60 * 1000 : canManage && !message.deletedAt;

  return (
    <div className="flex h-[560px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div><p className="text-sm font-black text-slate-900">Circle Chat</p><p className={`text-[10px] font-bold ${connectionState === "connected" ? "text-emerald-600" : connectionState === "offline" ? "text-amber-600" : "text-slate-400"}`}>{connectionState === "connected" ? "Live" : connectionState === "offline" ? "Reconnecting..." : "Connecting..."}</p></div>
        <button type="button" onClick={() => setShowPinned((v) => !v)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Pinned {pinned.length ? `(${pinned.length})` : ""}</button>
      </div>
      {showPinned && <div className="border-b border-amber-100 bg-amber-50/60 p-3"><div className="space-y-2">{pinned.length ? pinned.map((p) => <button key={p.id} type="button" onClick={() => document.getElementById(`message-${p.messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className="block w-full rounded-xl bg-white p-3 text-left"><p className="text-xs font-bold text-slate-800">{p.message.content}</p><p className="mt-1 text-[10px] text-slate-400">Pinned by {p.pinnedByUsername}</p></button>) : <p className="text-xs text-slate-500">No pinned messages.</p>}</div></div>}
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        {messages.length === 0 && !error && <p className="pt-10 text-center text-sm text-slate-400">No messages yet. Say hello 👋</p>}
        {messages.map((m) => {
          const isMine = m.userId === myUserId || (Number.isNaN(myUserId) && m.username === myUsername);
          const deleted = !!m.deletedAt;
          return <div id={`message-${m.id}`} key={m.id} className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? "bg-accent text-white" : "bg-slate-100 text-slate-800"}`}>
              {!isMine && <p className="mb-0.5 text-xs font-black text-accent">{m.username}</p>}
              {deleted ? <p className="italic opacity-70">This message was deleted.</p> : editing?.id === m.id ? <div className="min-w-[220px]"><textarea value={editing.content} onChange={(e) => setEditing((v) => ({ ...v, content: e.target.value }))} maxLength={2000} rows={3} className="w-full rounded-lg border border-white/40 bg-white/10 p-2 text-sm text-inherit outline-none" /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg px-2 py-1 text-xs font-bold opacity-80">Cancel</button><button type="button" onClick={saveEdit} className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-accent-hover">Save</button></div></div> : <><p className="leading-5 whitespace-pre-wrap break-words">{m.content}</p><div className="mt-1 flex items-center gap-2 text-[10px] opacity-70"><span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>{m.editedAt && <span>Edited</span>}{m.isPinned && <span className="inline-flex items-center gap-0.5"><Pin className="h-2.5 w-2.5" /> Pinned</span>}</div></>}
              {!deleted && editing?.id !== m.id && (canEdit(m) || canDelete(m) || (canManage && !deleted)) && <div className="absolute -right-2 -top-2"><button type="button" onClick={() => setMenuId((v) => v === m.id ? null : m.id)} className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"><MoreVertical className="h-4 w-4" /></button>{menuId === m.id && <div className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl">{canEdit(m) && <button type="button" onClick={() => { setEditing({ id: m.id, content: m.content }); setMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" />Edit</button>}{canDelete(m) && <button type="button" onClick={() => deleteMessage(m.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Delete</button>}{canManage && <button type="button" onClick={() => togglePin(m)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50"><Pin className="h-3.5 w-3.5" />{m.isPinned ? "Unpin" : "Pin"}</button>}</div>}</div>}
            </div>
          </div>;
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 p-3"><input type="text" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Message the circle..." maxLength={2000} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent-soft0 focus:bg-white" /><button type="submit" disabled={!content.trim() || connectionState !== "connected"} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50">Send</button></form>
    </div>
  );
}
