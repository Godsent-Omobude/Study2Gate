import { useCallback, useEffect, useState } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "../api/api";
import { AdminShieldIcon } from "./icons/AdminIcons";

// Surfaces GET /admin/copyright/users/:id/history and
// POST /admin/copyright/users/:id/actions — both existed on the backend
// but had no UI: the only way to see a user's copyright standing or to
// Warn/Suspend/Terminate them was to happen to have one of their flagged
// files open in the Copyright Review Queue. This makes both reachable
// directly from User Management.
const fmtDate = (value) => (value ? new Date(value).toLocaleString() : "—");

export default function UserCopyrightDrawer({ userId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/copyright/users/${userId}/history`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this user's copyright history.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (action, { promptLabel, suspendDays } = {}) => {
    let reason = "";
    if (promptLabel) {
      reason = window.prompt(promptLabel) || "";
      if (reason === "") return;
    }
    setBusy(action);
    setMessage("");
    setError("");
    try {
      const res = await api.post(`/admin/copyright/users/${userId}/actions`, { action, reason, suspendDays });
      setMessage(res.data.message || "Action applied.");
      await load();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to perform this account action.");
    } finally {
      setBusy("");
    }
  };

  const user = data?.user;
  const isSuspended = Boolean(user?.suspendedUntil) && new Date(user.suspendedUntil) > new Date();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl bg-slate-50 overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <AdminShieldIcon size={20} style={{ color: "var(--accent)" }} /> Copyright Standing
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {loading || !data ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : !user ? (
            <p className="text-sm text-slate-500">User not found.</p>
          ) : (
            <>
              <div>
                <h4 className="text-lg font-black text-slate-800">{user.fullName}</h4>
                <p className="text-sm text-slate-500">{user.username}</p>
              </div>

              <Card title="Standing">
                <Row label="Copyright warnings" value={user.copyrightWarnings ?? 0} />
                <Row label="Reports filed against their uploads" value={data.reportsAgainst ?? 0} />
                <Row label="Substantiated reports" value={data.substantiatedReports ?? 0} />
                <Row label="Files currently restricted" value={data.restrictedCount ?? 0} />
                <Row label="Files removed" value={data.removedCount ?? 0} />
                {isSuspended && <Row label="Currently suspended until" value={fmtDate(user.suspendedUntil)} />}
                {user.suspendedReason && <Row label="Suspension reason" value={user.suspendedReason} />}
                {user.terminatedAt && <Row label="Terminated" value={fmtDate(user.terminatedAt)} />}
                {user.terminatedReason && <Row label="Termination reason" value={user.terminatedReason} />}
              </Card>

              <Card title="Account actions">
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    tone="warn"
                    busy={busy === "WARN"}
                    onClick={() => runAction("WARN", { promptLabel: "Reason for warning (optional, press OK to confirm):" })}
                  >
                    Warn
                  </ActionButton>
                  {isSuspended ? (
                    <ActionButton tone="warn" busy={busy === "UNSUSPEND"} onClick={() => runAction("UNSUSPEND")}>
                      Lift Suspension
                    </ActionButton>
                  ) : (
                    <ActionButton
                      tone="warn"
                      busy={busy === "SUSPEND"}
                      onClick={() => runAction("SUSPEND", { promptLabel: "Reason for suspension:", suspendDays: 7 })}
                    >
                      Suspend (7 days)
                    </ActionButton>
                  )}
                  <ActionButton
                    tone="danger"
                    busy={busy === "TERMINATE"}
                    onClick={() => runAction("TERMINATE", { promptLabel: "Reason for terminating this account:" })}
                  >
                    Terminate Account
                  </ActionButton>
                </div>
                <p className="text-[11px] text-slate-400 mt-3">
                  These apply directly to the account — no flagged file needs to be open.
                </p>
              </Card>

              <Card title={`Enforcement history (${data.actions?.length || 0})`}>
                {(data.actions || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No copyright-enforcement actions recorded for this user yet.</p>
                ) : (
                  data.actions.map((entry) => (
                    <div key={entry.id} className="text-xs border-b last:border-0 border-slate-100 py-2 flex justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-700">{entry.action}</span>
                        {entry.reason && <p className="text-slate-500 mt-0.5">{entry.reason}</p>}
                      </div>
                      <span className="text-slate-500 shrink-0">{entry.admin?.fullName || "—"} · {fmtDate(entry.createdAt)}</span>
                    </div>
                  ))
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h5 className="font-black text-sm text-slate-800 mb-3">{title}</h5>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-800 text-right">{value}</span>
    </div>
  );
}

function ActionButton({ children, onClick, busy, tone = "default" }) {
  const tones = {
    default: "bg-accent text-white hover:opacity-90",
    warn: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    danger: "bg-red-100 text-red-700 hover:bg-red-200",
  };
  return (
    <button
      onClick={onClick}
      disabled={Boolean(busy)}
      className={`px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 ${tones[tone]}`}
    >
      {busy ? "Working..." : children}
    </button>
  );
}
