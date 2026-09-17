import { useState } from "react";
import api from "../../api/api";
import { useAdmin } from "./AdminContext";
import { SectionHeader, SystemCard, ApiEndpointGroup, ApiEndpoint } from "./AdminUI";

export default function AdminDeveloper() {
  const { adminInfo, stats, loadStats, verifyAdmin, clearMessages } = useAdmin();
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    clearMessages();
    setLoading(true);
    await Promise.all([verifyAdmin(), loadStats()]);
    setLoading(false);
  };

  return (
    <section>
      <SectionHeader
        title="Developer Controls"
        description="Developer-facing status and administrator information."
        onRefresh={refresh}
        loading={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SystemCard icon="lock" title="Administrator Access" value="Verified" healthy />
        <SystemCard icon="globe" title="Admin API" value="Connected" healthy />
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
        <h3 className="font-black text-slate-800">Administrator API</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">The frontend is connected to:</p>
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
  );
}
