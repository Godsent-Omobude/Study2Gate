import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Download, Sparkles, MapPin, ArrowLeft, Infinity as InfinityIcon } from "lucide-react";
import api from "../api/api";
import CircleChat from "../components/CircleChat";
import { createStudySocket } from "../api/socket";
import OutOfCreditsModal from "../components/OutOfCreditsModal";
import { broadcastDownloadCredits, readDownloadErrorPayload } from "../utils/downloadCredits";

const ROLE_BADGE = {
  OWNER: "bg-amber-100 text-amber-700",
  MODERATOR: "bg-accent-soft text-accent-hover",
  MEMBER: "bg-slate-100 text-slate-600",
};

function ChatTab({ circleId, myRole, onAccessRevoked }) {
  return <CircleChat circleId={circleId} myRole={myRole} onAccessRevoked={onAccessRevoked} />;
}

function MaterialsTab({ circleId }) {
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [allFiles, setAllFiles] = useState([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [sharing, setSharing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/circles/${circleId}/files`);
      setShared(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load shared materials.");
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    load();
  }, [load]);

  const openPicker = async () => {
    setShowPicker(true);
    try {
      const response = await api.get("/files");
      setAllFiles(Array.isArray(response.data) ? response.data : []);
    } catch {
      setAllFiles([]);
    }
  };

  const shareFile = async (fileId) => {
    try {
      setSharing(fileId);
      await api.post(`/circles/${circleId}/files`, { fileId });
      setShowPicker(false);
      load();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to share this material.");
    } finally {
      setSharing(null);
    }
  };

  const alreadySharedIds = new Set(shared.map((s) => s.file.id));
  const filteredPickerFiles = allFiles
    .filter((f) => !alreadySharedIds.has(f.id))
    .filter((f) =>
      pickerSearch
        ? f.title?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          f.courseCode?.toLowerCase().includes(pickerSearch.toLowerCase())
        : true
    );

  const downloadFile = async (fileId, title) => {
    if (downloadingId === fileId) return;
    setDownloadingId(fileId);

    try {
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = title || "study-material";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      broadcastDownloadCredits(response.headers?.["x-download-credits"]);
    } catch (err) {
      const payload = await readDownloadErrorPayload(err);

      if (payload?.code === "INSUFFICIENT_CREDITS") {
        setShowOutOfCredits(true);
      } else {
        window.alert(payload?.message || "Unable to download this file.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Materials shared with this circle from Academic Materials.
        </p>
        <button
          onClick={openPicker}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"
        >
          + Share Material
        </button>
      </div>

      {showPicker && (
        <div className="mb-4 rounded-2xl border border-accent-soft bg-accent-soft/40 p-4">
          <input
            type="text"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Search your materials library..."
            className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-soft0"
          />
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredPickerFiles.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No materials found.
              </p>
            ) : (
              filteredPickerFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {f.title}
                    </p>
                    <p className="text-xs text-slate-400">{f.courseCode}</p>
                  </div>
                  <button
                    onClick={() => shareFile(f.id)}
                    disabled={sharing === f.id}
                    className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {sharing === f.id ? "Sharing..." : "Share"}
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="mt-3 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          Loading materials...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : shared.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No materials shared here yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shared.map((s) => (
            <div
              key={s.shareId}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="font-bold text-slate-900">{s.file.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {s.file.courseCode} · shared by {s.sharedByUsername}
              </p>
              {s.unavailable ? (
                <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                  Unavailable — under copyright review
                </p>
              ) : (
                <button
                  onClick={() => downloadFile(s.file.id, s.file.title)}
                  disabled={downloadingId === s.file.id}
                  className="mt-3 inline-block rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-hover hover:bg-accent-soft disabled:opacity-50"
                >
                  {downloadingId === s.file.id ? "Downloading..." : (
                    <span className="inline-flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" /> Download
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <OutOfCreditsModal open={showOutOfCredits} onClose={() => setShowOutOfCredits(false)} />
    </div>
  );
}

function FlashcardsTab({ circleId }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/circles/${circleId}/flashcards`)
      .then((response) => {
        if (!cancelled) setSets(Array.isArray(response.data) ? response.data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load flashcards.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [circleId]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Flashcard sets generated for this circle — visible to every member.
        </p>
        <Link
          to={`/generate-flashcards?circleId=${circleId}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover"
        >
          <Sparkles className="h-4 w-4" /> Generate for Circle
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          Loading flashcards...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : sets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No flashcards generated for this circle yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sets.map((s) => (
            <Link
              key={s.id}
              to={`/my-flashcards/${s.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
            >
              <p className="font-bold text-slate-900">{s.title}</p>
              <p className="mt-1 text-xs text-slate-400">
                {s.cardCount} cards · {s.difficulty} · by {s.createdByUsername}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MembersTab({ circleId, myRole, onRoleChanged }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteMessage, setInviteMessage] = useState({ text: "", isError: false });
  const [inviting, setInviting] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

  const canManage = myRole === "OWNER" || myRole === "MODERATOR";
  const isOwner = myRole === "OWNER";

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/circles/${circleId}/members`);
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  const loadJoinRequests = useCallback(async () => {
    if (!canManage) return;
    try {
      const response = await api.get(`/circles/${circleId}/join-requests`);
      setJoinRequests(Array.isArray(response.data) ? response.data : []);
    } catch {
      // Non-critical.
    }
  }, [circleId, canManage]);

  useEffect(() => {
    loadMembers();
    loadJoinRequests();
  }, [loadMembers, loadJoinRequests]);

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviteMessage({ text: "", isError: false });
    if (!inviteUsername.trim()) return;

    try {
      setInviting(true);
      await api.post(`/circles/${circleId}/invites`, {
        username: inviteUsername.trim(),
      });
      setInviteMessage({ text: `Invite sent to ${inviteUsername.trim()}.`, isError: false });
      setInviteUsername("");
    } catch (err) {
      setInviteMessage({
        text: err.response?.data?.message || "Unable to send invite.",
        isError: true,
      });
    } finally {
      setInviting(false);
    }
  };

  const respondToRequest = async (requestId, approve) => {
    try {
      await api.post(
        `/circles/${circleId}/join-requests/${requestId}/${approve ? "approve" : "decline"}`
      );
      setJoinRequests((current) => current.filter((r) => r.id !== requestId));
      if (approve) loadMembers();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to update this request.");
    }
  };

  const removeMember = async (userId, username) => {
    if (!window.confirm(`Remove ${username} from this circle?`)) return;
    try {
      await api.delete(`/circles/${circleId}/members/${userId}`);
      setMembers((current) => current.filter((member) => member.userId !== userId));
    } catch (err) { window.alert(err.response?.data?.message || "Unable to remove member."); }
  };

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/circles/${circleId}/members/${userId}`, { role });
      loadMembers();
      onRoleChanged?.();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to update role.");
    }
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-2xl border border-accent-soft bg-accent-soft/40 p-4">
          <h3 className="text-sm font-black text-slate-900">
            Invite by username
          </h3>
          <form onSubmit={sendInvite} className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="username"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-soft0"
            />
            <button
              type="submit"
              disabled={inviting || !inviteUsername.trim()}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send Invite"}
            </button>
          </form>
          {inviteMessage.text && (
            <p
              className={`mt-2 text-xs font-semibold ${
                inviteMessage.isError ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {inviteMessage.text}
            </p>
          )}
        </div>
      )}

      {canManage && joinRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-black text-amber-900">
            Pending Join Requests
          </h3>
          <div className="mt-3 space-y-2">
            {joinRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"
              >
                <span className="text-sm font-bold text-slate-800">
                  {r.user?.username}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToRequest(r.id, true)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => respondToRequest(r.id, false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          Loading members...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-black text-accent-hover">
                  {m.username[0]?.toUpperCase()}
                </div>
                <span className="font-bold text-slate-800">{m.username}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                    ROLE_BADGE[m.role]
                  }`}
                >
                  {m.role}
                </span>
                {((isOwner && m.role !== "OWNER") || (myRole === "MODERATOR" && m.role === "MEMBER")) && (
                  <button
                    type="button"
                    onClick={() => removeMember(m.userId, m.username)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
                {isOwner && m.role !== "OWNER" && (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.userId, e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MODERATOR">Moderator</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JoinCodeManagement({ circleId }) {
  const [settings, setSettings] = useState(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/circles/${circleId}/join-code`);
      setSettings(response.data);
      setExpiresAt(response.data?.expiresAt ? new Date(response.data.expiresAt).toISOString().slice(0, 16) : "");
      setMaxUses(response.data?.maxUses == null ? "" : String(response.data.maxUses));
    } catch (err) { setMessage(err.response?.data?.message || "Unable to load join-code settings."); }
  }, [circleId]);

  useEffect(() => { load(); }, [load]);

  // Live update: the backend is the source of truth for the usage count.
  // Whenever someone successfully joins (direct code or invitation link),
  // it pushes the authoritative post-increment count here so this panel
  // never sits on a stale number until the page is manually refreshed.
  useEffect(() => {
    const socket = createStudySocket();
    const onUsageUpdated = (payload) => {
      if (!payload || Number(payload.circleId) !== Number(circleId)) return;
      setSettings((current) => {
        if (!current) return current;
        const uses = payload.uses;
        const maxUsesValue = payload.maxUses === undefined ? current.maxUses : payload.maxUses;
        return {
          ...current,
          uses,
          maxUses: maxUsesValue,
          usesRemaining: maxUsesValue == null ? null : Math.max(0, maxUsesValue - uses),
        };
      });
    };
    socket.on("join-code:usage-updated", onUsageUpdated);
    return () => socket.off("join-code:usage-updated", onUsageUpdated);
  }, [circleId]);

  const save = async () => {
    try {
      setSaving(true); setMessage("");
      const response = await api.patch(`/circles/${circleId}/join-code`, { expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, maxUses: maxUses === "" ? null : Number(maxUses) });
      setSettings(response.data); setMessage("Join-code settings updated.");
    } catch (err) { setMessage(err.response?.data?.message || "Unable to update join-code settings."); }
    finally { setSaving(false); }
  };

  const regenerate = async () => {
    if (!window.confirm("Regenerate this join code? The current code and invitation links will stop working immediately.")) return;
    try { const response = await api.post(`/circles/${circleId}/join-code/regenerate`); setSettings(response.data); setExpiresAt(response.data?.expiresAt ? new Date(response.data.expiresAt).toISOString().slice(0,16) : ""); setMaxUses(response.data?.maxUses == null ? "" : String(response.data.maxUses)); setInviteUrl(""); setMessage("A new join code has been generated."); }
    catch (err) { setMessage(err.response?.data?.message || "Unable to regenerate the join code."); }
  };

  const toggle = async () => {
    try { const response = await api.post(`/circles/${circleId}/join-code/${settings?.enabled ? "disable" : "enable"}`); setSettings((current) => ({ ...current, ...response.data })); setMessage(settings?.enabled ? "Join code disabled." : "Join code enabled."); }
    catch (err) { setMessage(err.response?.data?.message || "Unable to change join-code status."); }
  };

  const createLink = async () => {
    try { const response = await api.post(`/circles/${circleId}/invitation-link`, { expiresInMinutes: 120, maxUses: maxUses === "" ? null : Number(maxUses) }); setInviteUrl(response.data.inviteUrl); await navigator.clipboard?.writeText(response.data.inviteUrl); setMessage("Temporary invitation link created and copied."); }
    catch (err) { setMessage(err.response?.data?.message || "Unable to create invitation link."); }
  };

  if (!settings) return <div className="rounded-2xl border border-accent-soft bg-accent-soft/40 p-4 text-sm text-slate-500">Loading join-code controls...</div>;
  return <section className="mb-5 rounded-3xl border border-accent-soft bg-accent-soft/50 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-black text-slate-900">Join Code Management</p><p className="mt-1 text-xs text-slate-500">Only the Circle Owner can change these settings.</p></div>
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${settings.enabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{settings.enabled ? "Active" : "Disabled"}</span>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Current code</p><p className="mt-1 font-black tracking-[0.18em] text-slate-900">{settings.joinCode}</p><button type="button" onClick={() => navigator.clipboard?.writeText(settings.joinCode)} className="mt-2 text-xs font-bold text-accent">Copy code</button></div>
      <label className="rounded-2xl bg-white p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Expiration</span><input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" /><span className="mt-1 block text-[10px] text-slate-400">Leave empty for no expiration.</span></label>
      <label className="rounded-2xl bg-white p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Maximum uses</span><input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" /><span className="mt-1 block text-[10px] text-slate-400">Successful joins only.</span></label>
      <div className="rounded-2xl bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Usage</p><p className="mt-1 text-sm font-black text-slate-900">{settings.uses}{settings.maxUses == null ? <> / <InfinityIcon className="inline h-3.5 w-3.5 align-[-2px]" /></> : ` / ${settings.maxUses}`}</p><p className="mt-1 text-[10px] text-slate-400">{settings.usesRemaining == null ? "Unlimited remaining" : `${settings.usesRemaining} remaining`}</p></div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save settings"}</button>
      <button type="button" onClick={regenerate} className="rounded-xl border border-accent-soft bg-white px-4 py-2.5 text-xs font-bold text-accent-hover">Regenerate</button>
      <button type="button" onClick={toggle} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">{settings.enabled ? "Disable" : "Enable"}</button>
      <button type="button" onClick={createLink} disabled={!settings.enabled} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50">Create temporary link</button>
    </div>
    {inviteUrl && <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Temporary invitation link</p><div className="mt-1 flex gap-2"><input readOnly value={inviteUrl} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs" /><button type="button" onClick={() => navigator.clipboard?.writeText(inviteUrl)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Copy</button></div></div>}
    {message && <p className="mt-3 text-xs font-semibold text-slate-600">{message}</p>}
  </section>;
}

const RSVP_LABEL = { GOING: "Going", MAYBE: "Maybe", DECLINED: "Can't go" };
const RSVP_STYLE = {
  GOING: "bg-emerald-600 text-white",
  MAYBE: "bg-amber-500 text-white",
  DECLINED: "bg-slate-400 text-white",
};

function SessionComposer({ circleId, onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !scheduledFor) {
      setError("Please give the session a title and a date/time.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await api.post(`/circles/${circleId}/sessions`, {
        title: title.trim(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        scheduledFor: new Date(scheduledFor).toISOString(),
        durationMinutes: Number(durationMinutes) || 60,
      });
      onCreated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to schedule this session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-5 rounded-2xl border border-accent-soft bg-accent-soft/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Session title (e.g. Midterm Review)"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location or call link (optional)"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <input
          type="number"
          min="5"
          max="720"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="Duration (minutes)"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What are you covering? (optional)"
        rows={2}
        className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-50">
          {saving ? "Scheduling..." : "Schedule Session"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

function SessionsTab({ circleId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [includePast, setIncludePast] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/circles/${circleId}/sessions`, {
        params: { includePast: includePast ? "true" : "false" },
      });
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load study sessions.");
    } finally {
      setLoading(false);
    }
  }, [circleId, includePast]);

  useEffect(() => {
    load();
  }, [load]);

  const rsvp = async (sessionId, status) => {
    try {
      const response = await api.post(`/circles/${circleId}/sessions/${sessionId}/rsvp`, { status });
      setSessions((current) => current.map((s) => (s.id === sessionId ? response.data : s)));
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to save your RSVP.");
    }
  };

  const cancelSession = async (sessionId) => {
    if (!window.confirm("Cancel this study session?")) return;
    try {
      await api.delete(`/circles/${circleId}/sessions/${sessionId}`);
      setSessions((current) => current.filter((s) => s.id !== sessionId));
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to cancel this session.");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <input type="checkbox" checked={includePast} onChange={(e) => setIncludePast(e.target.checked)} />
          Show past sessions
        </label>
        {!showComposer && (
          <button onClick={() => setShowComposer(true)} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover">
            + Schedule Session
          </button>
        )}
      </div>

      {showComposer && (
        <SessionComposer
          circleId={circleId}
          onCancel={() => setShowComposer(false)}
          onCreated={(session) => {
            setSessions((current) => [...current, session].sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)));
            setShowComposer(false);
          }}
        />
      )}

      {loading ? (
        <div className="animate-pulse rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Loading sessions...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No study sessions scheduled yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{session.title}</p>
                  <p className="mt-1 text-xs font-semibold text-accent">
                    {new Date(session.scheduledFor).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    {" · "}{session.durationMinutes} min
                  </p>
                  {session.location && <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> {session.location}</p>}
                  {session.description && <p className="mt-2 text-sm text-slate-600">{session.description}</p>}
                  <p className="mt-2 text-[11px] text-slate-400">
                    Created by {session.createdByUser?.username} ·{" "}
                    {session.rsvpCounts.GOING} going · {session.rsvpCounts.MAYBE} maybe
                  </p>
                </div>
                <button onClick={() => cancelSession(session.id)} className="text-xs font-bold text-red-500 hover:text-red-700">
                  Cancel
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                {Object.keys(RSVP_LABEL).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => rsvp(session.id, status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      session.myRsvpStatus === status ? RSVP_STYLE[status] : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {RSVP_LABEL[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTab({ circleId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [openNoteId, setOpenNoteId] = useState(null);
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/circles/${circleId}/notes`);
      setNotes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load shared notes.");
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    load();
  }, [load]);

  const createNote = async () => {
    if (!newTitle.trim()) return;
    try {
      setSaving(true);
      const response = await api.post(`/circles/${circleId}/notes`, { title: newTitle.trim(), content: "" });
      setNotes((current) => [response.data, ...current]);
      setNewTitle("");
      setCreating(false);
      setOpenNoteId(response.data.id);
      setDraftContent("");
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to create this note.");
    } finally {
      setSaving(false);
    }
  };

  const openNote = (note) => {
    setOpenNoteId(note.id);
    setDraftContent(note.content || "");
  };

  const saveNote = async (noteId) => {
    try {
      setSaving(true);
      const response = await api.patch(`/circles/${circleId}/notes/${noteId}`, { content: draftContent });
      setNotes((current) => current.map((n) => (n.id === noteId ? response.data : n)));
      setOpenNoteId(null);
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to save this note.");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.delete(`/circles/${circleId}/notes/${noteId}`);
      setNotes((current) => current.filter((n) => n.id !== noteId));
      if (openNoteId === noteId) setOpenNoteId(null);
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to delete this note.");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          A shared resoure for this circle. Any member can add or edit a note.
        </p>
        {!creating && (
          <button onClick={() => setCreating(true)} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover">
            + New Note
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title (e.g. Exam 2 topics)"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <button onClick={createNote} disabled={saving} className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
            Create
          </button>
          <button onClick={() => setCreating(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Loading notes...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
      ) : notes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No shared notes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{note.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Updated by {note.updatedByUser?.username || note.createdByUser?.username} ·{" "}
                    {new Date(note.updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {openNoteId !== note.id && (
                    <button onClick={() => openNote(note)} className="text-xs font-bold text-accent hover:text-accent-hover">
                      Edit
                    </button>
                  )}
                  <button onClick={() => deleteNote(note.id)} className="text-xs font-bold text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </div>

              {openNoteId === note.id ? (
                <div className="mt-3">
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => saveNote(note.id)} disabled={saving} className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setOpenNoteId(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                note.content && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.content}</p>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudyCircleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const VALID_TABS = ["chat", "materials", "flashcards", "sessions", "notes", "members"];
  const initialTab = searchParams.get("tab");
  // Deep-linkable: "View in circle" (after generating a Circle flashcard
  // set) and other links can land the user directly on the right tab
  // instead of always defaulting to Chat.
  const [tab, setTabState] = useState(VALID_TABS.includes(initialTab) ? initialTab : "chat");
  const setTab = useCallback((next) => {
    setTabState(next);
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.set("tab", next);
      return params;
    }, { replace: true });
  }, [setSearchParams]);
  const [requesting, setRequesting] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/circles/${id}`);
      setCircle(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this circle.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const requestToJoin = async () => {
    try {
      setRequesting(true);
      await api.post(`/circles/${id}/join-requests`);
      load();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to request to join.");
    } finally {
      setRequesting(false);
    }
  };

  const accessRevoked = useCallback(() => navigate("/circles"), [navigate]);

  const leaveCircle = async () => {
    try {
      await api.post(`/circles/${id}/leave`);
      navigate("/circles");
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to leave this circle.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-slate-50 p-8">
        <div className="mx-auto max-w-5xl animate-pulse rounded-3xl bg-white p-10 shadow-sm">
          Loading circle...
        </div>
      </main>
    );
  }

  if (error || !circle) {
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">
            {error || "Circle not found."}
          </p>
          <Link
            to="/circles"
            className="mt-4 inline-block text-sm font-bold text-accent"
          >
            <span className="inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back to Study Circles</span>
          </Link>
        </div>
      </main>
    );
  }

  if (!circle.isMember) {
    // Public, non-member preview.
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">{circle.name}</h1>
          {circle.courseCode && (
            <p className="mt-1 text-sm font-bold text-accent">
              {circle.courseCode}
            </p>
          )}
          {circle.description && (
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
              {circle.description}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"} ·
            owned by {circle.ownerUsername}
          </p>

          {circle.hasPendingRequest ? (
            <span className="mt-6 inline-block rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-500">
              Request Pending
            </span>
          ) : (
            <button
              onClick={requestToJoin}
              disabled={requesting}
              className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {requesting ? "Requesting..." : "Request to Join"}
            </button>
          )}

          <div>
            <Link
              to="/circles"
              className="mt-6 inline-block text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              <span className="inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back to Study Circles</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tabs = [
    { key: "chat", label: "Chat" },
    { key: "materials", label: "Materials" },
    { key: "flashcards", label: "Flashcards" },
    { key: "sessions", label: "Sessions" },
    { key: "notes", label: "Notes" },
    { key: "members", label: "Members" },
  ];

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/circles" className="text-xs font-bold text-accent">
          <span className="inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back to Study Circles</span>
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {circle.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                  circle.visibility === "PUBLIC"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {circle.visibility}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${ROLE_BADGE[circle.role]}`}
              >
                {circle.role}
              </span>
            </div>
            {circle.courseCode && (
              <p className="mt-1 text-sm font-bold text-accent">
                {circle.courseCode}
              </p>
            )}
            {circle.description && (
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                {circle.description}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"}
              {circle.role === "OWNER" && circle.joinCode && <> · join code: <span className="font-bold tracking-wider">{circle.joinCode}</span></>}
            </p>
          </div>

          <div className="text-right">
            {leaveConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={leaveCircle}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                >
                  Confirm Leave
                </button>
                <button
                  onClick={() => setLeaveConfirm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLeaveConfirm(true)}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                Leave Circle
              </button>
            )}
          </div>
        </div>

        {circle.role === "OWNER" && <JoinCodeManagement circleId={circle.id} />}

        <div className="mt-5 mb-5 flex gap-2 border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                tab === t.key
                  ? "border-accent text-accent-hover"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "chat" && <ChatTab circleId={circle.id} myRole={circle.role} onAccessRevoked={accessRevoked} />}
        {tab === "materials" && <MaterialsTab circleId={circle.id} />}
        {tab === "flashcards" && <FlashcardsTab circleId={circle.id} />}
        {tab === "sessions" && <SessionsTab circleId={circle.id} />}
        {tab === "notes" && <NotesTab circleId={circle.id} />}
        {tab === "members" && (
          <MembersTab
            circleId={circle.id}
            myRole={circle.role}
            onRoleChanged={load}
          />
        )}
      </div>
    </main>
  );
}
