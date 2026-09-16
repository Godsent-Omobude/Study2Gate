import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Users,
  User,
  Folder,
  GraduationCap,
  Download,
  Layers,
  BookOpen,
  Settings as SettingsIcon,
  RefreshCw,
  Lock,
  Globe,
  Database,
  Link2,
  FileText,
} from "lucide-react";
import api from "../api/api";
import CopyrightReviewPanel from "../components/CopyrightReviewPanel";
import UserCopyrightDrawer from "../components/UserCopyrightDrawer";

const ICONS = {
  shield: Shield,
  "check-circle": CheckCircle2,
  "alert-triangle": AlertTriangle,
  "bar-chart": BarChart3,
  users: Users,
  user: User,
  folder: Folder,
  "graduation-cap": GraduationCap,
  download: Download,
  layers: Layers,
  cards: BookOpen,
  settings: SettingsIcon,
  refresh: RefreshCw,
  lock: Lock,
  globe: Globe,
  database: Database,
};

function Icon({ name, className = "h-5 w-5" }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component className={className} aria-hidden="true" />;
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");

  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);

  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");

  const [adminInfo, setAdminInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Which user's Copyright Standing drawer is open (User Management tab).
  const [copyrightUserId, setCopyrightUserId] = useState(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const clearMessages = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  const handleApiError = useCallback((err, fallback) => {
    console.error(err);

    if (err.response?.status === 401) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("role");
      window.location.href = "/login";
      return;
    }

    if (err.response?.status === 403) {
      setError("Access denied. Your account is no longer an administrator.");
      return;
    }

    setError(err.response?.data?.message || fallback);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");

      setStats(res.data.stats);
      setRecentUsers(res.data.recentUsers || []);
      setRecentFiles(res.data.recentFiles || []);
    } catch (err) {
      handleApiError(err, "Unable to load administrator statistics.");
    }
  }, [handleApiError]);

  const verifyAdmin = useCallback(async () => {
    try {
      const res = await api.get("/admin/check");

      setAdminInfo(res.data.user);
    } catch (err) {
      handleApiError(err, "Unable to verify administrator access.");
    }
  }, [handleApiError]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");

      setUsers(res.data.users || []);
    } catch (err) {
      handleApiError(err, "Unable to load users.");
    }
  }, [handleApiError]);

  const loadFiles = useCallback(async () => {
    try {
      const res = await api.get("/admin/files");

      setFiles(res.data.files || []);
    } catch (err) {
      handleApiError(err, "Unable to load uploaded files.");
    }
  }, [handleApiError]);

  const loadDashboard = useCallback(async () => {
    clearMessages();
    setLoading(true);

    // AdminRoute already verified admin access (and showed its own
    // "Verifying administrator access..." screen) before this component
    // was allowed to mount — this call just fetches this page's own admin
    // profile card, not a second access check, so it shouldn't block
    // render. Users and Files are large lists the Overview tab doesn't
    // need; openSection() already lazy-loads each one the first time its
    // tab is opened, so fetching them here too would just be duplicate
    // work on every visit.
    verifyAdmin();

    try {
      await loadStats();
    } finally {
      setLoading(false);
    }
  }, [clearMessages, verifyAdmin, loadStats]);

  useEffect(() => {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    loadDashboard();
  }, [isLoggedIn, loadDashboard]);

  const openSection = async (section) => {
    clearMessages();
    setActiveSection(section);

    if (section === "users" && users.length === 0) {
      setSectionLoading(true);
      await loadUsers();
      setSectionLoading(false);
    }

    if (section === "files" && files.length === 0) {
      setSectionLoading(true);
      await loadFiles();
      setSectionLoading(false);
    }
  };

  const changeRole = async (user) => {
    const newRole = user.role === "admin" ? "student" : "admin";

    const action =
      newRole === "admin"
        ? `make ${user.username} an administrator`
        : `remove administrator access from ${user.username}`;

    if (!window.confirm(`Are you sure you want to ${action}?`)) {
      return;
    }

    clearMessages();
    setActionLoading(`role-${user.id}`);

    try {
      const res = await api.patch(
        `/admin/users/${user.id}/role`,
        { role: newRole }
      );

      setMessage(res.data.message || "User role updated successfully.");

      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      handleApiError(err, "Unable to update user role.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteUser = async (user) => {
    if (
      !window.confirm(
        `Delete ${user.fullName} (${user.username})? This action cannot be undone.`
      )
    ) {
      return;
    }

    clearMessages();
    setActionLoading(`delete-user-${user.id}`);

    try {
      const res = await api.delete(`/admin/users/${user.id}`);

      setMessage(res.data.message || "User deleted successfully.");

      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      handleApiError(err, "Unable to delete user.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteFile = async (file) => {
    const fileLabel = file.title || file.filename || file.externalUrl || `File #${file.id}`;
    const hasCopyrightHistory = file.copyrightStatus && file.copyrightStatus !== "CLEARED";

    const confirmMessage = hasCopyrightHistory
      ? `"${fileLabel}" currently has copyright status "${file.copyrightStatus.replace(
          /_/g,
          " "
        )}". This hard-delete bypasses the reversible Copyright Review flow — the uploader won't be able to dispute it and it can't be restored afterward. Consider using the Copyright Review Queue's "Remove" action instead, which keeps that option open.\n\nDelete anyway? This cannot be undone.`
      : `Delete "${fileLabel}"? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    clearMessages();
    setActionLoading(`delete-file-${file.id}`);

    try {
      const res = await api.delete(`/admin/files/${file.id}`);

      if (res.data.warning) {
        // Record deletion still succeeded, but storage cleanup did not —
        // surface this as a warning rather than a plain success message so
        // it isn't missed (see adminController.deleteAdminFile).
        setError(res.data.warning);
      } else {
        setMessage(res.data.message || "File deleted successfully.");
      }

      await Promise.all([loadFiles(), loadStats()]);
    } catch (err) {
      handleApiError(err, "Unable to delete file.");
    } finally {
      setActionLoading("");
    }
  };

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [
        user.fullName,
        user.username,
        user.role,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [users, userSearch]);

  const filteredFiles = useMemo(() => {
    const query = fileSearch.trim().toLowerCase();

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
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [files, fileSearch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
            <Icon name="shield" className="h-7 w-7" />
          </div>
          <p className="font-bold text-slate-700">
            Loading Study2Gate controls
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">
                Restricted Area
              </p>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
                Admin Workspace
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Manage Study2Gate users, uploaded materials and system activity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-blue text-white flex items-center justify-center font-black">
                {(adminInfo?.fullName || "A").charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="font-bold text-slate-800">
                  {adminInfo?.fullName || "Administrator"}
                </p>

                <p className="text-xs text-slate-500">
                  {adminInfo?.username || ""}
                </p>

                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase">
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-7">
        {/* Messages */}
        {message && (
          <div className="mb-5 flex items-center gap-2.5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
            <Icon name="check-circle" className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            <Icon name="alert-triangle" className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mb-7 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <AdminNavButton
            active={activeSection === "overview"}
            icon="bar-chart"
            title="Overview"
            onClick={() => openSection("overview")}
          />

          <AdminNavButton
            active={activeSection === "users"}
            icon="users"
            title="User Management"
            onClick={() => openSection("users")}
          />

          <AdminNavButton
            active={activeSection === "files"}
            icon="folder"
            title="File Management"
            onClick={() => openSection("files")}
          />

          <AdminNavButton
            active={activeSection === "copyright"}
            icon="shield"
            title="Copyright Review"
            onClick={() => openSection("copyright")}
          />

          <AdminNavButton
            active={activeSection === "developer"}
            icon="settings"
            title="Developer Controls"
            onClick={() => openSection("developer")}
          />
        </div>

        {/* OVERVIEW */}
        {activeSection === "overview" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  System Overview
                </h2>
                <p className="text-sm text-slate-500">
                  A quick view of the Study2Gate platform.
                </p>
              </div>

              <button
                onClick={loadDashboard}
                className="self-start inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Icon name="refresh" className="h-4 w-4" />
                Refresh
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                People
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon="users" title="Total Users" value={stats?.users} />
                <StatCard icon="graduation-cap" title="Students" value={stats?.students} />
                <StatCard icon="shield" title="Administrators" value={stats?.admins} />
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                Content
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon="folder" title="Uploaded Files" value={stats?.files} />
                <StatCard icon="download" title="Downloads" value={stats?.downloads} />
                <StatCard icon="layers" title="Flashcard Sets" value={stats?.flashcardSets} />
                <StatCard icon="cards" title="Flashcards" value={stats?.flashcards} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
              <RecentUsers users={recentUsers} />

              <RecentFiles
                files={recentFiles}
                onOpenFiles={() => openSection("files")}
              />
            </div>
          </section>
        )}

        {/* USERS */}
        {activeSection === "users" && (
          <section>
            <SectionHeader
              title="User Management"
              description="View registered users and manage administrator privileges."
              onRefresh={async () => {
                clearMessages();
                setSectionLoading(true);
                await Promise.all([loadUsers(), loadStats()]);
                setSectionLoading(false);
              }}
              loading={sectionLoading}
            />

            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, matriculation number or role..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState text="No users match your search." />
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const isCurrentAdmin = user.id === adminInfo?.id;

                  return (
                    <div
                      key={user.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue font-black">
                          {(user.fullName || "U").charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-800 truncate">
                              {user.fullName}
                            </p>
                            {isCurrentAdmin && (
                              <span className="text-[10px] font-black uppercase text-brand-blue">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{user.username}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <RoleBadge role={user.role} />
                            {user.terminatedAt && (
                              <StandingBadge tone="terminated">Terminated</StandingBadge>
                            )}
                            {!user.terminatedAt &&
                              user.suspendedUntil &&
                              new Date(user.suspendedUntil) > new Date() && (
                                <StandingBadge tone="suspended">Suspended</StandingBadge>
                              )}
                            {Boolean(user.copyrightWarnings) && (
                              <StandingBadge tone="warned">
                                {user.copyrightWarnings} warning{user.copyrightWarnings === 1 ? "" : "s"}
                              </StandingBadge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>{user._count?.files ?? 0} files</span>
                        <span>{user._count?.flashcardSets ?? 0} flashcard sets</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                        {isCurrentAdmin ? (
                          <span className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 font-semibold text-sm">
                            Your account
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => setCopyrightUserId(user.id)}
                              disabled={Boolean(actionLoading)}
                              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Copyright
                            </button>

                            <button
                              onClick={() => changeRole(user)}
                              disabled={Boolean(actionLoading)}
                              className={
                                user.role === "admin"
                                  ? "px-3 py-2 rounded-lg bg-orange-50 text-orange-700 font-bold text-sm hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  : "px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-bold text-sm hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              }
                            >
                              {actionLoading === `role-${user.id}`
                                ? "Updating..."
                                : user.role === "admin"
                                ? "Remove Admin"
                                : "Make Admin"}
                            </button>

                            <button
                              onClick={() => deleteUser(user)}
                              disabled={Boolean(actionLoading)}
                              className="px-3 py-2 rounded-lg bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === `delete-user-${user.id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* FILES */}
        {activeSection === "files" && (
          <section>
            <SectionHeader
              title="File Management"
              description="Monitor and remove uploaded Study2Gate materials."
              onRefresh={async () => {
                clearMessages();
                setSectionLoading(true);
                await Promise.all([loadFiles(), loadStats()]);
                setSectionLoading(false);
              }}
              loading={sectionLoading}
            />

            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
              <input
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                placeholder="Search by title, filename, course, type or uploader..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            {filteredFiles.length === 0 ? (
              <EmptyState text="No uploaded files match your search." />
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {file.title || file.filename}
                        </p>
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
                        {actionLoading === `delete-file-${file.id}`
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* COPYRIGHT REVIEW */}
        {activeSection === "copyright" && <CopyrightReviewPanel />}

        {/* DEVELOPER CONTROLS */}
        {activeSection === "developer" && (
          <section>
            <SectionHeader
              title="Developer Controls"
              description="Developer-facing status and administrator information."
              onRefresh={async () => {
                clearMessages();
                setSectionLoading(true);
                await Promise.all([verifyAdmin(), loadStats()]);
                setSectionLoading(false);
              }}
              loading={sectionLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SystemCard
                icon="lock"
                title="Administrator Access"
                value="Verified"
                healthy
              />

              <SystemCard
                icon="globe"
                title="Admin API"
                value="Connected"
                healthy
              />

              <SystemCard
                icon="user"
                title="Current Administrator"
                value={adminInfo?.username || "Unknown"}
                healthy
              />

              <SystemCard
                icon="database"
                title="Database Records"
                value={`${stats?.users ?? 0} users • ${stats?.files ?? 0} files`}
                healthy
              />
            </div>

            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-black text-slate-800">
                Administrator API
              </h3>

              <p className="text-sm text-slate-500 mt-1 mb-4">
                The frontend is connected to:
              </p>

              <code className="block bg-slate-900 text-slate-100 rounded-xl p-4 text-sm break-all">
                {api.defaults.baseURL}/admin
              </code>

              <div className="mt-5 space-y-4">
                <ApiEndpointGroup title="Users">
                  <ApiEndpoint method="GET" path="/admin/check" />
                  <ApiEndpoint method="GET" path="/admin/stats" />
                  <ApiEndpoint method="GET" path="/admin/users" />
                  <ApiEndpoint method="PATCH" path="/admin/users/:id/role" />
                  <ApiEndpoint method="DELETE" path="/admin/users/:id" />
                </ApiEndpointGroup>

                <ApiEndpointGroup title="Materials (legacy hard-delete)">
                  <ApiEndpoint method="GET" path="/admin/files" />
                  <ApiEndpoint method="DELETE" path="/admin/files/:id" />
                </ApiEndpointGroup>

                <ApiEndpointGroup title="Copyright Review Queue">
                  <ApiEndpoint method="GET" path="/admin/copyright/stats" />
                  <ApiEndpoint method="GET" path="/admin/copyright/queue" />
                  <ApiEndpoint method="GET" path="/admin/copyright/files/:id" />
                  <ApiEndpoint method="POST" path="/admin/copyright/files/:id/actions" />
                  <ApiEndpoint method="POST" path="/admin/copyright/files/:id/notes" />
                </ApiEndpointGroup>

                <ApiEndpointGroup title="Copyright — account enforcement">
                  <ApiEndpoint method="GET" path="/admin/copyright/users/:id/history" />
                  <ApiEndpoint method="POST" path="/admin/copyright/users/:id/actions" />
                </ApiEndpointGroup>

                <ApiEndpointGroup title="Copyright — reports & disputes">
                  <ApiEndpoint method="GET" path="/admin/copyright/reports" />
                  <ApiEndpoint method="PATCH" path="/admin/copyright/reports/:id" />
                  <ApiEndpoint method="GET" path="/admin/copyright/disputes" />
                  <ApiEndpoint method="PATCH" path="/admin/copyright/disputes/:id" />
                </ApiEndpointGroup>

                <ApiEndpointGroup title="Copyright — audit log">
                  <ApiEndpoint method="GET" path="/admin/copyright/audit-log" />
                </ApiEndpointGroup>
              </div>
            </div>
          </section>
        )}
      </main>

      {copyrightUserId && (
        <UserCopyrightDrawer
          userId={copyrightUserId}
          onClose={() => setCopyrightUserId(null)}
          onChanged={() => { loadUsers(); loadStats(); }}
        />
      )}
    </div>
  );
}

function AdminNavButton({ active, icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
        active
          ? "border-brand-blue bg-brand-blue text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {title}
    </button>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="text-2xl font-black text-slate-800 mt-1">
        {value === null || value === undefined ? "—" : value}
      </p>
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase ${
        isAdmin
          ? "bg-purple-100 text-purple-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {role}
    </span>
  );
}

function StandingBadge({ tone, children }) {
  const tones = {
    suspended: "bg-orange-100 text-orange-700",
    terminated: "bg-red-100 text-red-700",
    warned: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${tones[tone] || "bg-slate-100 text-slate-600"}`}
    >
      {children}
    </span>
  );
}

const FILE_COPYRIGHT_STYLES = {
  PENDING: "bg-slate-100 text-slate-700",
  CLEARED: "bg-green-100 text-green-700",
  REVIEW_REQUIRED: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-orange-100 text-orange-700",
  REMOVED: "bg-red-100 text-red-700",
  REJECTED: "bg-slate-200 text-slate-600",
};

// Shown in File Management so a hard-delete here is never done blind to
// the fact this file might already be mid-way through the reversible
// Copyright Review flow (see the confirm() warning in deleteFile()).
function FileCopyrightBadge({ status }) {
  if (!status) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${FILE_COPYRIGHT_STYLES[status] || "bg-slate-100 text-slate-600"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SectionHeader({ title, description, onRefresh, loading }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
      <div>
        <h2 className="text-xl font-black text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="self-start inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <Icon
          name="refresh"
          className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

function RecentUsers({ users }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-black text-slate-800">Recent Users</h3>
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
                <p className="font-bold text-sm text-slate-800">
                  {user.fullName}
                </p>
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
        <h3 className="font-black text-slate-800">Recent Files</h3>

        <button
          onClick={onOpenFiles}
          className="text-xs font-bold text-brand-blue hover:underline"
        >
          View all
        </button>
      </div>

      <div>
        {files.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No files found.</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="px-5 py-4 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-800">
                  {file.title || file.filename}
                </p>
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

function SystemCard({ icon, title, value, healthy }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
        <Icon name={icon} className="h-5 w-5" />
      </div>

      <p className="text-sm font-semibold text-slate-500">{title}</p>

      <div className="flex items-center gap-2 mt-2">
        <span
          className={`w-3 h-3 rounded-full ${
            healthy ? "bg-green-500" : "bg-slate-400"
          }`}
        />

        <p className="font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ApiEndpointGroup({ title, children }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function ApiEndpoint({ method, path }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
      <span className="text-[10px] font-black text-slate-500 mr-2">
        {method}
      </span>
      <code className="text-xs text-slate-700">{path}</code>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-10 text-center text-slate-500">
      {text}
    </div>
  );
}
