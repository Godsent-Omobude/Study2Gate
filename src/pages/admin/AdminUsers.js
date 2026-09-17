import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import UserCopyrightDrawer from "../../components/UserCopyrightDrawer";
import { useAdmin } from "./AdminContext";
import { SectionHeader, EmptyState, RoleBadge, StandingBadge } from "./AdminUI";

export default function AdminUsers() {
  const { adminInfo, actionLoading, setActionLoading, loadStats, clearMessages, showMessage, handleApiError } =
    useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copyrightUserId, setCopyrightUserId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      handleApiError(err, "Unable to load users.");
    }
  }, [handleApiError]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadUsers();
      setLoading(false);
    })();
  }, [loadUsers]);

  const refresh = async () => {
    clearMessages();
    setLoading(true);
    await Promise.all([loadUsers(), loadStats()]);
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.fullName, user.username, user.role].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [users, search]);

  const changeRole = async (user) => {
    const newRole = user.role === "admin" ? "student" : "admin";
    const action =
      newRole === "admin"
        ? `make ${user.username} an administrator`
        : `remove administrator access from ${user.username}`;

    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    clearMessages();
    setActionLoading(`role-${user.id}`);
    try {
      const res = await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      showMessage(res.data.message || "User role updated successfully.");
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      handleApiError(err, "Unable to update user role.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.fullName} (${user.username})? This action cannot be undone.`)) {
      return;
    }

    clearMessages();
    setActionLoading(`delete-user-${user.id}`);
    try {
      const res = await api.delete(`/admin/users/${user.id}`);
      showMessage(res.data.message || "User deleted successfully.");
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      handleApiError(err, "Unable to delete user.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <section>
      <SectionHeader
        title="User Management"
        description="View registered users and manage administrator privileges."
        onRefresh={refresh}
        loading={loading}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, matriculation number or role..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "var(--accent)" }}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState text={loading ? "Loading users..." : "No users match your search."} />
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isCurrentAdmin = user.id === adminInfo?.id;

            return (
              <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black"
                    style={{ color: "var(--accent)", backgroundColor: "var(--accent-soft)" }}
                  >
                    {(user.fullName || "U").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-800 truncate">{user.fullName}</p>
                      {isCurrentAdmin && (
                        <span
                          className="text-[10px] font-black uppercase"
                          style={{ color: "var(--accent)" }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{user.username}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <RoleBadge role={user.role} />
                      {user.terminatedAt && <StandingBadge tone="terminated">Terminated</StandingBadge>}
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
                            : "px-3 py-2 rounded-lg bg-accent-soft text-accent font-bold text-sm hover:bg-accent-soft disabled:opacity-50 disabled:cursor-not-allowed"
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
                        {actionLoading === `delete-user-${user.id}` ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {copyrightUserId && (
        <UserCopyrightDrawer
          userId={copyrightUserId}
          onClose={() => setCopyrightUserId(null)}
          onChanged={() => {
            loadUsers();
            loadStats();
          }}
        />
      )}
    </section>
  );
}
