import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, FileText } from "lucide-react";
import api from "../../api/api";
import { useAdmin } from "./AdminContext";
import { SectionHeader, EmptyState, FileCopyrightBadge } from "./AdminUI";

export default function AdminFiles() {
  const { actionLoading, setActionLoading, loadStats, clearMessages, showMessage, showError, handleApiError } =
    useAdmin();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadFiles = useCallback(async () => {
    try {
      const res = await api.get("/admin/files");
      setFiles(res.data.files || []);
    } catch (err) {
      handleApiError(err, "Unable to load uploaded files.");
    }
  }, [handleApiError]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadFiles();
      setLoading(false);
    })();
  }, [loadFiles]);

  const refresh = async () => {
    clearMessages();
    setLoading(true);
    await Promise.all([loadFiles(), loadStats()]);
    setLoading(false);
  };

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return files;
    return files.filter((file) =>
      [
        file.title,
        file.filename,
        file.courseCode,
        file.type,
        file.uploaderName,
        file.user?.fullName,
        file.user?.username,
        file.externalDomain,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [files, search]);

  const deleteFile = async (file) => {
    const fileLabel = file.title || file.filename || file.externalUrl || `File #${file.id}`;
    const hasCopyrightHistory = file.copyrightStatus && file.copyrightStatus !== "CLEARED";

    const confirmMessage = hasCopyrightHistory
      ? `"${fileLabel}" currently has copyright status "${file.copyrightStatus.replace(
          /_/g,
          " "
        )}". This hard-delete bypasses the reversible Copyright Review flow — the uploader won't be able to dispute it and it can't be restored afterward. Consider using the Copyright Review Queue's "Remove" action instead, which keeps that option open.\n\nDelete anyway? This cannot be undone.`
      : `Delete "${fileLabel}"? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    clearMessages();
    setActionLoading(`delete-file-${file.id}`);
    try {
      const res = await api.delete(`/admin/files/${file.id}`);
      if (res.data.warning) {
        // Record deletion still succeeded, but storage cleanup did not —
        // surface this as a warning rather than a plain success message so
        // it isn't missed (see adminController.deleteAdminFile).
        showError(res.data.warning);
      } else {
        showMessage(res.data.message || "File deleted successfully.");
      }
      await Promise.all([loadFiles(), loadStats()]);
    } catch (err) {
      handleApiError(err, "Unable to delete file.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <section>
      <SectionHeader
        title="File Management"
        description="Browse uploaded materials and remove content directly."
        onRefresh={refresh}
        loading={loading}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, course, filename or uploader..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "var(--accent)" }}
        />
      </div>

      {filteredFiles.length === 0 ? (
        <EmptyState text={loading ? "Loading files..." : "No uploaded files match your search."} />
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <div key={file.id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{file.title || file.filename}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {file.sourceType === "EXTERNAL_LINK"
                      ? file.externalDomain || file.externalUrl
                      : file.filename}
                  </p>
                </div>
                <FileCopyrightBadge status={file.copyrightStatus} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-block px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                  {file.type || file.mimetype || "FILE"}
                </span>
                {file.sourceType === "EXTERNAL_LINK" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-100 text-sky-700 text-[10px] font-bold uppercase">
                    <Link2 className="h-3 w-3" /> External
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    <FileText className="h-3 w-3" /> Uploaded
                  </span>
                )}
                {file.courseCode && (
                  <span className="inline-block px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    {file.courseCode}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {file.uploaderName || file.user?.fullName || "Unknown"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {file.user?.username ? `${file.user.username} · ` : ""}
                    {file.downloads ?? 0} download{file.downloads === 1 ? "" : "s"}
                  </p>
                </div>

                <button
                  onClick={() => deleteFile(file)}
                  disabled={Boolean(actionLoading)}
                  className="shrink-0 px-3 py-2 rounded-lg bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === `delete-file-${file.id}` ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
