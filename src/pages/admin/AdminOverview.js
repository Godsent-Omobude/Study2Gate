import { useNavigate } from "react-router-dom";
import { useAdmin } from "./AdminContext";
import { Icon, StatCard, RoleBadge } from "./AdminUI";
import { Link2 } from "lucide-react";

function RecentUsers({ users }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-black text-slate-800">Recent users</h3>
      </div>
      <div>
        {users.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No users found.</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="px-5 py-4 border-b last:border-0 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-sm text-slate-800">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.username}</p>
              </div>
              <RoleBadge role={user.role} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecentFiles({ files, onOpenFiles }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <h3 className="font-black text-slate-800">Recent files</h3>
        <button
          onClick={onOpenFiles}
          className="text-xs font-bold hover:underline"
          style={{ color: "var(--accent)" }}
        >
          View all
        </button>
      </div>
      <div>
        {files.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No files found.</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className="px-5 py-4 border-b last:border-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-800">{file.title || file.filename}</p>
                {file.sourceType === "EXTERNAL_LINK" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[9px] font-bold uppercase">
                    <Link2 className="h-2.5 w-2.5" /> External
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                <span>{file.courseCode || "No course"}</span>
                <span>{file.uploaderName || "Unknown uploader"}</span>
                <span>
                  {file.sourceType === "EXTERNAL_LINK"
                    ? file.externalDomain || "hosted externally"
                    : `${file.downloads ?? 0} downloads`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { stats, recentUsers, recentFiles, loadStats, verifyAdmin, clearMessages } = useAdmin();
  const navigate = useNavigate();

  const refresh = async () => {
    clearMessages();
    await Promise.all([loadStats(), verifyAdmin()]);
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800">System overview</h2>
          <p className="text-sm text-slate-500">A quick view of the Study2Gate platform.</p>
        </div>
        <button
          onClick={refresh}
          className="self-start inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <Icon name="refresh" className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">People</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon="users" title="Total Users" value={stats?.users} />
          <StatCard icon="graduation-cap" title="Students" value={stats?.students} />
          <StatCard icon="shield" title="Administrators" value={stats?.admins} />
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Content</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="folder" title="Uploaded Files" value={stats?.files} />
          <StatCard icon="download" title="Downloads" value={stats?.downloads} />
          <StatCard icon="layers" title="Flashcard Sets" value={stats?.flashcardSets} />
          <StatCard icon="cards" title="Flashcards" value={stats?.flashcards} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <RecentUsers users={recentUsers} />
        <RecentFiles files={recentFiles} onOpenFiles={() => navigate("/admin/files")} />
      </div>
    </section>
  );
}
