import { useCallback, useEffect, useState } from "react";
import {
  X,
  RefreshCw,
  FileWarning,
  Flag,
  Scale,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Ban,
  Trash2,
  Link2,
} from "lucide-react";
import { AdminShieldIcon } from "./icons/AdminIcons";
import api from "../api/api";

const RISK_STYLES = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-green-100 text-green-700",
};

const STATUS_STYLES = {
  PENDING: "bg-slate-100 text-slate-700",
  CLEARED: "bg-green-100 text-green-700",
  REVIEW_REQUIRED: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-orange-100 text-orange-700",
  REMOVED: "bg-red-100 text-red-700",
  REJECTED: "bg-slate-200 text-slate-600",
};

const QUEUE_FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High Risk", dot: "bg-red-500" },
  { key: "medium", label: "Medium Risk", dot: "bg-amber-400" },
  { key: "cleared", label: "Cleared", dot: "bg-green-500" },
  { key: "reported", label: "Reported" },
  { key: "restricted", label: "Restricted" },
  { key: "removed", label: "Removed" },
  { key: "uploaded", label: "Uploaded Files" },
  { key: "external", label: "External Links" },
  { key: "repeat", label: "Repeat-infringer accounts" },
];

const REPORT_STATUSES = ["PENDING", "UNDER_REVIEW", "ACTION_TAKEN", "REJECTED", "RESOLVED", "CLOSED"];
const DISPUTE_STATUSES = ["PENDING", "UNDER_REVIEW", "UPHELD", "RESTORED", "CLOSED"];

const fmtDate = (value) => (value ? new Date(value).toLocaleString() : "—");
const pct = (value) => `${Math.round((value || 0) * 100)}%`;

export default function CopyrightReviewPanel() {
  const [tab, setTab] = useState("queue");
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const notify = useCallback((msg) => { setMessage(msg); setError(""); }, []);
  const fail = useCallback((err, fallback) => {
    setError(err.response?.data?.message || fallback);
    setMessage("");
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/copyright/stats");
      setStats(res.data.stats);
    } catch (err) {
      fail(err, "Unable to load copyright statistics.");
    }
  }, [fail]);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800">Copyright Review Queue</h2>
          <p className="text-sm text-slate-500 mt-1">
            Automated screening flags material for human review. Similarity is evidence, not proof of infringement — every restriction, removal, or account action here is a human decision.
          </p>
        </div>
        <button
          onClick={loadStats}
          className="self-start inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {message && (
        <div className="mb-5 flex items-center gap-2.5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-center gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          <AlertTriangle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <MiniStat label="High Risk" value={stats?.high} dot="bg-red-500" />
        <MiniStat label="Under Review" value={stats?.medium} dot="bg-amber-400" />
        <MiniStat label="Cleared" value={stats?.cleared} dot="bg-green-500" />
        <MiniStat label="Reported" value={stats?.reported} icon={FileText} />
        <MiniStat label="Restricted" value={stats?.restricted} icon={Ban} />
        <MiniStat label="Removed" value={stats?.removed} icon={Trash2} />
        <MiniStat label="Open Disputes" value={stats?.pendingDisputes} icon={Scale} />
      </div>

      <div className="flex gap-2 mb-5 border-b border-slate-200">
        <TabButton active={tab === "queue"} onClick={() => setTab("queue")} icon={FileWarning} label="Review Queue" />
        <TabButton active={tab === "reports"} onClick={() => setTab("reports")} icon={Flag} label="Reports" />
        <TabButton active={tab === "disputes"} onClick={() => setTab("disputes")} icon={Scale} label="Disputes" />
        <TabButton active={tab === "audit"} onClick={() => setTab("audit")} icon={History} label="Audit Log" />
      </div>

      {tab === "queue" && <QueueTab notify={notify} fail={fail} onChanged={loadStats} />}
      {tab === "reports" && <ReportsTab notify={notify} fail={fail} onChanged={loadStats} />}
      {tab === "disputes" && <DisputesTab notify={notify} fail={fail} onChanged={loadStats} />}
      {tab === "audit" && <AuditTab fail={fail} />}
    </section>
  );
}

function TabButton({ active, onClick, icon: IconCmp, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${
        active ? "border-accent text-accent" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <IconCmp className="h-4 w-4" /> {label}
    </button>
  );
}

function Dot({ color }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function MiniStat({ label, value, dot, icon: IconCmp }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {dot && <Dot color={dot} />}
        {IconCmp && <IconCmp className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="text-2xl font-black text-slate-800 mt-1">{value ?? "—"}</p>
    </div>
  );
}

function RiskBadge({ risk }) {
  if (!risk) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${RISK_STYLES[risk] || "bg-slate-100 text-slate-600"}`}>
      {risk}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}>
      {String(status || "").replace(/_/g, " ")}
    </span>
  );
}

function SourceBadge({ sourceType }) {
  const isExternal = sourceType === "EXTERNAL_LINK";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
        isExternal ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {isExternal ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
      {isExternal ? "External" : "Uploaded"}
    </span>
  );
}

// --- Queue tab -------------------------------------------------------------

function QueueTab({ notify, fail, onChanged }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  // Lets the drawer's "View original" button jump to the file a duplicate
  // was matched against (which may be REMOVED/RESTRICTED — admins can
  // always see it), while still being able to navigate back.
  const [navigationStack, setNavigationStack] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/copyright/queue", { params: { filter, search } });
      setFiles(res.data.files || []);
    } catch (err) {
      fail(err, "Unable to load the review queue.");
    } finally {
      setLoading(false);
    }
  }, [filter, search, fail]);

  useEffect(() => { load(); }, [load]);

  const openFile = (id) => {
    setNavigationStack([]);
    setSelectedId(id);
  };

  const navigateToFile = (id) => {
    setNavigationStack((stack) => [...stack, selectedId]);
    setSelectedId(id);
  };

  const navigateBack = () => {
    setNavigationStack((stack) => {
      if (!stack.length) return stack;
      const next = [...stack];
      setSelectedId(next.pop());
      return next;
    });
  };

  const closeDrawer = () => {
    setSelectedId(null);
    setNavigationStack([]);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {QUEUE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              filter === f.key ? "bg-accent text-white border-accent" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.dot && <Dot color={f.dot} />}
            {f.label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title, course code, or uploader..."
        className="w-full mb-4 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
      />

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="text-left px-5 py-3">File</th>
              <th className="text-left px-5 py-3">Source</th>
              <th className="text-left px-5 py-3">Uploader</th>
              <th className="text-left px-5 py-3">Risk</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Similarity</th>
              <th className="text-left px-5 py-3">Reports</th>
              <th className="text-left px-5 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={8} text="Loading..." />
            ) : files.length === 0 ? (
              <EmptyRow colSpan={8} text="Nothing matches this filter." />
            ) : (
              files.map((file) => (
                <tr
                  key={file.id}
                  onClick={() => openFile(file.id)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-800">{file.title}</p>
                    <p className="text-xs text-slate-400">{file.courseCode || "No course"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <SourceBadge sourceType={file.sourceType} />
                    {file.sourceType === "EXTERNAL_LINK" && file.externalDomain && (
                      <p className="mt-1 text-[11px] text-slate-400">{file.externalDomain}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">{file.user?.fullName || file.uploaderName || "Unknown"}</td>
                  <td className="px-5 py-3"><RiskBadge risk={file.copyrightRisk} /></td>
                  <td className="px-5 py-3"><StatusBadge status={file.copyrightStatus} /></td>
                  <td className="px-5 py-3">{file.similarityScore ? pct(file.similarityScore) : "—"}</td>
                  <td className="px-5 py-3">{file.reportCount || 0}</td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(file.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <FileDetailDrawer
          fileId={selectedId}
          onClose={closeDrawer}
          onNavigate={navigateToFile}
          onBack={navigationStack.length ? navigateBack : null}
          notify={notify}
          fail={fail}
          onChanged={() => { load(); onChanged(); }}
        />
      )}
    </div>
  );
}

function FileDetailDrawer({ fileId, onClose, onNavigate, onBack, notify, fail, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/copyright/files/${fileId}`);
      setData(res.data);
    } catch (err) {
      fail(err, "Unable to load file details.");
    } finally {
      setLoading(false);
    }
  }, [fileId, fail]);

  useEffect(() => { load(); }, [load]);

  // Lets an admin pull down the actual file content — used both for the
  // file under review and for the original it was matched as a duplicate
  // of, so the two can be compared directly. Admins can always download
  // any file regardless of copyrightStatus (see isVisibleToViewer in
  // routes/files.js) — including a REMOVED original.
  const downloadFile = async (id, filename) => {
    setBusy(`download-${id}`);
    try {
      const res = await api.get(`/files/download/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "study-material";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      fail(err, "Unable to download this file.");
    } finally {
      setBusy("");
    }
  };

  const runFileAction = async (action, { promptLabel } = {}) => {
    let reason = "";
    if (promptLabel) {
      reason = window.prompt(promptLabel) || "";
      if (promptLabel && reason === "") return;
    }
    setBusy(action);
    try {
      const res = await api.post(`/admin/copyright/files/${fileId}/actions`, { action, reason });
      notify(res.data.message || "Action applied.");
      await load();
      onChanged();
    } catch (err) {
      fail(err, "Unable to perform this action.");
    } finally {
      setBusy("");
    }
  };

  const runUserAction = async (action, { promptLabel, suspendDays } = {}) => {
    let reason = "";
    if (promptLabel) {
      reason = window.prompt(promptLabel) || "";
      if (reason === "") return;
    }
    setBusy(`user-${action}`);
    try {
      const res = await api.post(`/admin/copyright/users/${data.file.user.id}/actions`, { action, reason, suspendDays });
      notify(res.data.message || "Account action applied.");
      await load();
      onChanged();
    } catch (err) {
      fail(err, "Unable to perform this account action.");
    } finally {
      setBusy("");
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy("note");
    try {
      await api.post(`/admin/copyright/files/${fileId}/notes`, { note });
      setNote("");
      await load();
    } catch (err) {
      fail(err, "Unable to add note.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl bg-slate-50 overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                title="Back to the duplicate you came from"
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <AdminShieldIcon size={20} style={{ color: "var(--accent)" }} /> Copyright Review
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {loading || !data ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-black text-slate-800">{data.file.title}</h4>
                  <SourceBadge sourceType={data.file.sourceType} />
                  <RiskBadge risk={data.file.copyrightRisk} />
                  <StatusBadge status={data.file.copyrightStatus} />
                </div>
                {data.file.sourceType === "EXTERNAL_LINK" ? (
                  <a
                    href={data.file.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open Source
                  </a>
                ) : (
                  <button
                    onClick={() => downloadFile(data.file.id, data.file.filename || data.file.title)}
                    disabled={busy === `download-${data.file.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {busy === `download-${data.file.id}` ? "Downloading..." : "Download this file"}
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {data.file.courseCode || "No course code"} · Uploaded by{" "}
                {data.file.user?.fullName || data.file.uploaderName || "Unknown"} on {fmtDate(data.file.createdAt)}
              </p>
              {data.file.sourceType === "EXTERNAL_LINK" && (
                <p className="mt-2 text-xs text-slate-500">
                  External resource. Study2Gate does not host this file — it remains available at its original source
                  {data.file.externalDomain ? `: ${data.file.externalDomain}` : "."}
                </p>
              )}
            </div>

            {data.file.sourceType === "EXTERNAL_LINK" ? (
              <Card title="Resource link">
                <Row
                  label="Submitted URL"
                  value={
                    <a
                      href={data.file.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {data.file.externalDomain || data.file.externalUrl}
                    </a>
                  }
                />
                <Row label="Source domain" value={data.file.externalDomain || "—"} />
                <p className="text-[11px] text-slate-400 mt-3">
                  Study2Gate is not uploading or redistributing this file — it's only cataloguing a resource that
                  already exists at its original source. Automated copyright screening does not apply, since no
                  content is fetched or stored.
                </p>
              </Card>
            ) : (
              <Card title="Automated evidence">
                {data.file.copyrightScanFailed ? (
                  <Row
                    label="Risk score"
                    value={
                      <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                        <AlertTriangle className="h-3.5 w-3.5" /> Scan failed — needs manual review
                      </span>
                    }
                  />
                ) : (
                  <Row label="Risk score" value={`${data.file.copyrightScore ?? 0} / 100`} />
                )}
                <Row label="Similarity to closest match" value={data.file.similarityScore ? pct(data.file.similarityScore) : "None found"} />
                {data.file.duplicateOf && (
                  <div className="mt-2 mb-1 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Flagged as a duplicate/near-duplicate of</p>
                      <p className="font-bold text-slate-800 truncate">{data.file.duplicateOf.title}</p>
                      <div className="mt-1"><StatusBadge status={data.file.duplicateOf.copyrightStatus} /></div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => onNavigate(data.file.duplicateOf.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View original
                      </button>
                      <button
                        onClick={() => downloadFile(data.file.duplicateOf.id, data.file.duplicateOf.title)}
                        disabled={busy === `download-${data.file.duplicateOf.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {busy === `download-${data.file.duplicateOf.id}` ? "..." : "Download original"}
                      </button>
                    </div>
                  </div>
                )}
                <Row label="Web match found" value={data.file.webMatchFound ? "Yes" : "No"} />
                <Row label="Review reason" value={data.file.reviewReason || "—"} />
                {data.file.sourceReferences?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-slate-500 mb-1">Source references</p>
                    <ul className="space-y-1">
                      {data.file.sourceReferences.map((ref, i) => (
                        <li key={i} className="text-xs text-slate-500 truncate">
                          <a href={ref.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                            {ref.domain || ref.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-3">
                  This is an automated risk signal, not a legal determination of infringement.
                </p>
              </Card>
            )}

            <Card title="Publication actions">
              <div className="flex flex-wrap gap-2">
                <ActionButton busy={busy === "CLEAR"} onClick={() => runFileAction("CLEAR")}>Clear / Publish</ActionButton>
                <ActionButton busy={busy === "RESTRICT"} onClick={() => runFileAction("RESTRICT", { promptLabel: "Reason for restricting this material:" })}>Restrict Access</ActionButton>
                <ActionButton busy={busy === "REMOVE"} onClick={() => runFileAction("REMOVE", { promptLabel: "Reason for removing this material:" })}>Remove Material</ActionButton>
                <ActionButton busy={busy === "RESTORE"} onClick={() => runFileAction("RESTORE")}>Restore Material</ActionButton>
                <ActionButton busy={busy === "REQUEST_INFO"} onClick={() => runFileAction("REQUEST_INFO", { promptLabel: "What information do you need from the uploader?" })}>Request Information</ActionButton>
              </div>
            </Card>

            <Card title={`Uploader account${data.file.user ? ` — ${data.file.user.fullName}` : ""}`}>
              {data.uploaderHistory?.user && (
                <>
                  <Row label="Copyright warnings" value={data.uploaderHistory.user.copyrightWarnings} />
                  <Row label="Reports filed against their uploads" value={data.uploaderHistory.reportsAgainst} />
                  <Row label="Substantiated reports" value={data.uploaderHistory.substantiatedReports} />
                  <Row label="Files currently restricted" value={data.uploaderHistory.restrictedCount} />
                  <Row label="Files removed" value={data.uploaderHistory.removedCount} />
                  {data.uploaderHistory.user.suspendedUntil && new Date(data.uploaderHistory.user.suspendedUntil) > new Date() && (
                    <Row label="Currently suspended until" value={fmtDate(data.uploaderHistory.user.suspendedUntil)} />
                  )}
                  {data.uploaderHistory.user.terminatedAt && <Row label="Terminated" value={fmtDate(data.uploaderHistory.user.terminatedAt)} />}
                </>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <ActionButton tone="warn" busy={busy === "user-WARN"} onClick={() => runUserAction("WARN", { promptLabel: "Reason for warning (optional, press OK to confirm):" })}>Warn Uploader</ActionButton>
                <ActionButton tone="warn" busy={busy === "user-SUSPEND"} onClick={() => runUserAction("SUSPEND", { promptLabel: "Reason for suspension:", suspendDays: 7 })}>Suspend (7 days)</ActionButton>
                <ActionButton tone="warn" busy={busy === "user-UNSUSPEND"} onClick={() => runUserAction("UNSUSPEND", {})}>Lift Suspension</ActionButton>
                <ActionButton tone="danger" busy={busy === "user-TERMINATE"} onClick={() => runUserAction("TERMINATE", { promptLabel: "Reason for terminating this account:" })}>Terminate Account</ActionButton>
              </div>
            </Card>

            <Card title={`Internal notes (${data.file.copyrightNotes?.length || 0})`}>
              <div className="space-y-2 mb-3">
                {(data.file.copyrightNotes || []).map((n) => (
                  <div key={n.id} className="text-sm bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-700">{n.note}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{n.author?.fullName} · {fmtDate(n.createdAt)}</p>
                  </div>
                ))}
                {!data.file.copyrightNotes?.length && <p className="text-xs text-slate-400">No internal notes yet. Not visible to students.</p>}
              </div>
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note (admins only)..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
                <ActionButton busy={busy === "note"} onClick={addNote}>Add</ActionButton>
              </div>
            </Card>

            {data.file.copyrightReports?.length > 0 && (
              <Card title={`Complaints filed (${data.file.copyrightReports.length})`}>
                {data.file.copyrightReports.map((r) => (
                  <div key={r.id} className="text-sm border-b last:border-0 border-slate-100 py-2">
                    <div className="flex items-center gap-2"><StatusBadge status={r.status} /><span className="text-slate-500 text-xs">{fmtDate(r.createdAt)}</span></div>
                    <p className="mt-1 text-slate-700">{r.explanation}</p>
                  </div>
                ))}
              </Card>
            )}

            {data.file.copyrightDisputes?.length > 0 && (
              <Card title={`Disputes (${data.file.copyrightDisputes.length})`}>
                {data.file.copyrightDisputes.map((d) => (
                  <div key={d.id} className="text-sm border-b last:border-0 border-slate-100 py-2">
                    <div className="flex items-center gap-2"><StatusBadge status={d.status} /><span className="text-slate-500 text-xs">{fmtDate(d.createdAt)}</span></div>
                    <p className="mt-1 text-slate-700">{d.explanation}</p>
                  </div>
                ))}
              </Card>
            )}

            <Card title="Audit history">
              {(data.auditLog || []).length === 0 ? (
                <p className="text-xs text-slate-400">No actions recorded yet.</p>
              ) : (
                data.auditLog.map((entry) => (
                  <div key={entry.id} className="text-xs border-b last:border-0 border-slate-100 py-2 flex justify-between gap-3">
                    <span className="font-bold text-slate-700">{entry.action}</span>
                    <span className="text-slate-400">{entry.admin?.username} · {fmtDate(entry.createdAt)}</span>
                  </div>
                ))
              )}
            </Card>
          </div>
        )}
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

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-slate-500">{text}</td>
    </tr>
  );
}

// --- Reports tab -------------------------------------------------------------

const NEW_CASE_DEFAULTS = {
  fileId: "",
  complainantName: "",
  complainantEmail: "",
  complainantPhone: "",
  copyrightedWork: "",
  infringingLocation: "",
  explanation: "",
  ownershipEvidence: "",
  supportingInfo: "",
  receivedAt: "",
  uploaderNotifiedAt: "",
  uploaderResponse: "",
  reason: "",
  decision: "",
  actionTaken: "",
};

function ReportsTab({ notify, fail, onChanged }) {
  const [status, setStatus] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCase, setNewCase] = useState(NEW_CASE_DEFAULTS);
  const [newCaseBusy, setNewCaseBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/copyright/reports", { params: status ? { status } : {} });
      setReports(res.data.reports || []);
    } catch (err) {
      fail(err, "Unable to load copyright reports.");
    } finally {
      setLoading(false);
    }
  }, [status, fail]);

  useEffect(() => { load(); }, [load]);

  const openReport = (report) => {
    setOpenId(report.id);
    setForm({
      status: report.status,
      outcome: report.outcome || "",
      decision: report.decision || "",
      actionTaken: report.actionTaken || "",
      reason: report.reason || "",
      uploaderNotifiedAt: toDatetimeLocal(report.uploaderNotifiedAt),
      uploaderResponse: report.uploaderResponse || "",
    });
  };

  const submit = async (reportId) => {
    setBusy(true);
    try {
      const payload = {
        ...form,
        // Empty string means "leave unchanged" for a text field, but for
        // the notified-date field an empty value means "clear it" — so
        // send null explicitly rather than omitting the key.
        uploaderNotifiedAt: form.uploaderNotifiedAt ? new Date(form.uploaderNotifiedAt).toISOString() : null,
      };
      const res = await api.patch(`/admin/copyright/reports/${reportId}`, payload);
      notify(res.data.report ? "Report updated." : "Updated.");
      setOpenId(null);
      await load();
      onChanged();
    } catch (err) {
      fail(err, "Unable to update this report.");
    } finally {
      setBusy(false);
    }
  };

  const submitNewCase = async () => {
    if (!newCase.fileId || !newCase.complainantName.trim() || !newCase.complainantEmail.trim() || !newCase.copyrightedWork.trim() || !newCase.explanation.trim()) {
      fail({}, "Please fill in the file ID, complainant name/email, the copyrighted work, and an explanation.");
      return;
    }
    setNewCaseBusy(true);
    try {
      const payload = {
        ...newCase,
        fileId: Number(newCase.fileId),
        receivedAt: newCase.receivedAt ? new Date(newCase.receivedAt).toISOString() : undefined,
        uploaderNotifiedAt: newCase.uploaderNotifiedAt ? new Date(newCase.uploaderNotifiedAt).toISOString() : undefined,
      };
      const res = await api.post("/admin/copyright/reports", payload);
      notify(`Case ${res.data.report?.caseNumber || ""} created.`);
      setShowNewCase(false);
      setNewCase(NEW_CASE_DEFAULTS);
      await load();
      onChanged();
    } catch (err) {
      fail(err, "Unable to create this case.");
    } finally {
      setNewCaseBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatus("")} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${!status ? "bg-accent text-white border-accent" : "bg-white text-slate-600 border-slate-200"}`}>All</button>
          {REPORT_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${status === s ? "bg-accent text-white border-accent" : "bg-white text-slate-600 border-slate-200"}`}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewCase((v) => !v)}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-white hover:bg-slate-700"
        >
          {showNewCase ? "Cancel new case" : "+ New case"}
        </button>
      </div>

      {showNewCase && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 space-y-3">
          <p className="text-sm font-black text-slate-800">Manually record a complaint</p>
          <p className="text-xs text-slate-400">
            For complaints that didn't come through the in-app report form. The case ID, file title/hash, and uploader are filled in automatically once you enter the file ID — this does not change the file's status; do that from the Review Queue tab.
          </p>
          <FormInput label="File ID" type="number" value={newCase.fileId} onChange={(v) => setNewCase((f) => ({ ...f, fileId: v }))} placeholder="e.g. 482" />
          <FormInput label="Complaint received (leave blank for now)" type="datetime-local" value={newCase.receivedAt} onChange={(v) => setNewCase((f) => ({ ...f, receivedAt: v }))} />
          <FormInput label="Complainant name" value={newCase.complainantName} onChange={(v) => setNewCase((f) => ({ ...f, complainantName: v }))} />
          <FormInput label="Complainant email" value={newCase.complainantEmail} onChange={(v) => setNewCase((f) => ({ ...f, complainantEmail: v }))} />
          <FormInput label="Complainant phone (optional)" value={newCase.complainantPhone} onChange={(v) => setNewCase((f) => ({ ...f, complainantPhone: v }))} />
          <FormInput label="Copyrighted work" value={newCase.copyrightedWork} onChange={(v) => setNewCase((f) => ({ ...f, copyrightedWork: v }))} />
          <FormInput label="Infringing location (optional)" value={newCase.infringingLocation} onChange={(v) => setNewCase((f) => ({ ...f, infringingLocation: v }))} />
          <FormTextarea label="Explanation" value={newCase.explanation} onChange={(v) => setNewCase((f) => ({ ...f, explanation: v }))} />
          <FormTextarea label="Ownership evidence (optional)" value={newCase.ownershipEvidence} onChange={(v) => setNewCase((f) => ({ ...f, ownershipEvidence: v }))} rows={2} />
          <FormInput label="Uploader notified at (optional)" type="datetime-local" value={newCase.uploaderNotifiedAt} onChange={(v) => setNewCase((f) => ({ ...f, uploaderNotifiedAt: v }))} />
          <FormTextarea label="Uploader response (optional)" value={newCase.uploaderResponse} onChange={(v) => setNewCase((f) => ({ ...f, uploaderResponse: v }))} rows={2} />
          <FormInput label="Reason (optional)" value={newCase.reason} onChange={(v) => setNewCase((f) => ({ ...f, reason: v }))} />
          <FormInput label="Final decision (optional)" value={newCase.decision} onChange={(v) => setNewCase((f) => ({ ...f, decision: v }))} />
          <div className="flex gap-2">
            <ActionButton busy={newCaseBusy} onClick={submitNewCase}>Create case</ActionButton>
            <button onClick={() => { setShowNewCase(false); setNewCase(NEW_CASE_DEFAULTS); }} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate-500">No copyright reports found.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="font-black text-slate-800">
                    {r.caseNumber && <span className="text-slate-400 font-mono text-xs mr-2">{r.caseNumber}</span>}
                    {r.file?.title || "Unknown file"}
                    {r.source === "MANUAL" && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Manual</span>}
                  </p>
                  <p className="text-xs text-slate-500">Uploader: {r.file?.uploaderName || "Unknown"} · Filed {fmtDate(r.createdAt)}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-slate-700 mb-1"><span className="font-bold">Copyrighted work:</span> {r.copyrightedWork}</p>
              <p className="text-sm text-slate-600 mb-3">{r.explanation}</p>
              <p className="text-xs text-slate-400 mb-3">Complainant: {r.complainantName} ({r.complainantEmail})</p>

              {openId === r.id ? (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <FormSelect label="Status" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={REPORT_STATUSES} />
                  <FormSelect label="Outcome" value={form.outcome} onChange={(v) => setForm((f) => ({ ...f, outcome: v }))} options={["", "LEGITIMATE", "UNFOUNDED", "INSUFFICIENT_INFORMATION", "FALSE_OR_MISLEADING"]} />
                  <FormInput label="Decision" value={form.decision} onChange={(v) => setForm((f) => ({ ...f, decision: v }))} />
                  <FormInput label="Action taken" value={form.actionTaken} onChange={(v) => setForm((f) => ({ ...f, actionTaken: v }))} placeholder="e.g. Material restricted; see review queue" />
                  <FormInput label="Internal reason" value={form.reason} onChange={(v) => setForm((f) => ({ ...f, reason: v }))} />
                  <FormInput label="Uploader notified at" type="datetime-local" value={form.uploaderNotifiedAt} onChange={(v) => setForm((f) => ({ ...f, uploaderNotifiedAt: v }))} />
                  <FormTextarea label="Uploader response" value={form.uploaderResponse} onChange={(v) => setForm((f) => ({ ...f, uploaderResponse: v }))} rows={2} />
                  <p className="text-[11px] text-slate-400">To restrict/remove/restore the material itself, use the Review Queue tab — this only records the decision on the report.</p>
                  <div className="flex gap-2">
                    <ActionButton busy={busy} onClick={() => submit(r.id)}>Save decision</ActionButton>
                    <button onClick={() => setOpenId(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => openReport(r)} className="text-xs font-bold text-accent hover:underline">Review this report</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Disputes tab -----------------------------------------------------------

function DisputesTab({ notify, fail, onChanged }) {
  const [status, setStatus] = useState("");
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/copyright/disputes", { params: status ? { status } : {} });
      setDisputes(res.data.disputes || []);
    } catch (err) {
      fail(err, "Unable to load disputes.");
    } finally {
      setLoading(false);
    }
  }, [status, fail]);

  useEffect(() => { load(); }, [load]);

  const openDispute = (dispute) => {
    setOpenId(dispute.id);
    setForm({ status: dispute.status, adminResponse: dispute.adminResponse || "" });
  };

  const submit = async (disputeId) => {
    setBusy(true);
    try {
      const res = await api.patch(`/admin/copyright/disputes/${disputeId}`, form);
      notify(res.data.dispute ? "Dispute updated." : "Updated.");
      setOpenId(null);
      await load();
      onChanged();
    } catch (err) {
      fail(err, "Unable to update this dispute.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setStatus("")} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${!status ? "bg-accent text-white border-accent" : "bg-white text-slate-600 border-slate-200"}`}>All</button>
        {DISPUTE_STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${status === s ? "bg-accent text-white border-accent" : "bg-white text-slate-600 border-slate-200"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : disputes.length === 0 ? (
          <p className="text-sm text-slate-500">No disputes found.</p>
        ) : (
          disputes.map((d) => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="font-black text-slate-800">{d.file?.title || "Unknown file"}</p>
                  <p className="text-xs text-slate-500">By {d.uploader?.fullName} · Filed {fmtDate(d.createdAt)} · File currently: <StatusBadge status={d.file?.copyrightStatus} /></p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-sm text-slate-700 mb-1">{d.explanation}</p>
              <p className="text-xs text-slate-400 mb-3">
                Owns work: {d.ownsWork ? "Yes" : "No"} · Has permission: {d.hasPermission ? "Yes" : "No"}
                {d.otherLawfulBasis ? ` · Other basis: ${d.otherLawfulBasis}` : ""}
              </p>

              {openId === d.id ? (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <FormSelect label="Decision" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={DISPUTE_STATUSES} />
                  <FormInput label="Response to uploader" value={form.adminResponse} onChange={(v) => setForm((f) => ({ ...f, adminResponse: v }))} />
                  <p className="text-[11px] text-slate-400">Setting the decision to RESTORED automatically clears the file's restriction/removal and re-publishes it.</p>
                  <div className="flex gap-2">
                    <ActionButton busy={busy} onClick={() => submit(d.id)}>Save decision</ActionButton>
                    <button onClick={() => setOpenId(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => openDispute(d)} className="text-xs font-bold text-accent hover:underline">Review this dispute</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Audit log tab -----------------------------------------------------------

function AuditTab({ fail }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/copyright/audit-log");
      setEntries(res.data.entries || []);
    } catch (err) {
      fail(err, "Unable to load the audit log.");
    } finally {
      setLoading(false);
    }
  }, [fail]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th className="text-left px-5 py-3">Action</th>
            <th className="text-left px-5 py-3">Admin</th>
            <th className="text-left px-5 py-3">File / User</th>
            <th className="text-left px-5 py-3">Reason</th>
            <th className="text-left px-5 py-3">When</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <EmptyRow colSpan={5} text="Loading..." />
          ) : entries.length === 0 ? (
            <EmptyRow colSpan={5} text="No actions recorded yet." />
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-bold text-slate-800">{entry.action}</td>
                <td className="px-5 py-3">{entry.admin?.username}</td>
                <td className="px-5 py-3 text-slate-500">
                  {entry.targetFileId ? `File #${entry.targetFileId}` : ""}
                  {entry.targetUserId ? ` User #${entry.targetUserId}` : ""}
                </td>
                <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{entry.reason || "—"}</td>
                <td className="px-5 py-3 text-slate-400">{fmtDate(entry.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs font-bold text-slate-500 mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt ? opt.replace(/_/g, " ") : "—"}</option>
        ))}
      </select>
    </label>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs font-bold text-slate-500 mb-1">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
    </label>
  );
}

function FormTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs font-bold text-slate-500 mb-1">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
    </label>
  );
}

// Formats a Date/ISO string for a <input type="datetime-local"> value, and
// back. Kept together since New Case + the edit form both need both
// directions.
function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
