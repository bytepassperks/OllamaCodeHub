"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { getToken, getUser, clearAuth, isAdmin } from "@/lib/auth";

type AdminTab = "overview" | "users" | "queries" | "models" | "logs";

interface AnalyticsData {
  totalUsers: number;
  totalQueries: number;
  dailyQueries: number;
  weeklyQueries: number;
  activeUsersToday: number;
  avgResponseMs: number;
}

interface UserRecord {
  id: string;
  email: string;
  role: string;
  banned: boolean;
  queriesUsed: number;
  createdAt: string;
  _count: { queries: number };
}

interface ModelRecord {
  id: string;
  name: string;
  tag: string;
  isDefault: boolean;
  isActive: boolean;
}

interface LogRecord {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
  user?: { email: string } | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("USER");
  const user = getUser();

  useEffect(() => {
    if (!getToken() || !isAdmin()) router.push("/login");
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const t = getToken();
      if (!t) return;

      if (tab === "overview") {
        const data = await apiClient("/admin/analytics", { token: t });
        setAnalytics(data);
      } else if (tab === "users") {
        const data = await apiClient(
          `/admin/users?search=${encodeURIComponent(searchQuery)}`,
          { token: t }
        );
        setUsers(data.users || []);
      } else if (tab === "models") {
        const data = await apiClient("/admin/models", { token: t });
        setModels(data.dbModels || []);
      } else if (tab === "logs") {
        const data = await apiClient("/admin/logs?limit=100", { token: t });
        setLogs(data.logs || []);
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [tab, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateUserRole = async (userId: string, role: string) => {
    const t = getToken();
    if (!t) return;
    await apiClient(`/admin/users/${userId}/role`, {
      token: t,
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    fetchData();
  };

  const toggleBan = async (userId: string, banned: boolean) => {
    const t = getToken();
    if (!t) return;
    await apiClient(`/admin/users/${userId}/ban`, {
      token: t,
      method: "PATCH",
      body: JSON.stringify({ banned }),
    });
    fetchData();
  };

  const resetPassword = async (userId: string) => {
    const password = prompt("Enter new password for this user (min 8 chars):");
    if (!password || password.length < 8) return;
    const t = getToken();
    if (!t) return;
    await apiClient(`/admin/users/${userId}/password`, {
      token: t,
      method: "POST",
      body: JSON.stringify({ password }),
    });
    alert("Password updated!");
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) return;
    const t = getToken();
    if (!t) return;
    try {
      await apiClient("/admin/users/create", {
        token: t,
        method: "POST",
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      setNewUserEmail("");
      setNewUserPassword("");
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const setDefaultModel = async (modelId: string) => {
    const t = getToken();
    if (!t) return;
    await apiClient(`/admin/models/${modelId}/default`, { token: t, method: "PATCH" });
    fetchData();
  };

  const deleteModelHandler = async (modelId: string) => {
    const t = getToken();
    if (!t) return;
    await apiClient(`/admin/models/${modelId}`, { token: t, method: "DELETE" });
    fetchData();
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "queries", label: "Queries" },
    { key: "models", label: "Models" },
    { key: "logs", label: "API Logs" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                O
              </div>
              <span className="font-bold">Admin Panel</span>
            </Link>
            <div className="flex gap-1">
              {tabs.map((t) => (
                <Button
                  key={t.key}
                  variant={tab === t.key ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Overview */}
        {tab === "overview" && analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Total Users", value: analytics.totalUsers },
              { label: "Total Queries", value: analytics.totalQueries },
              { label: "Queries Today", value: analytics.dailyQueries },
              { label: "Queries This Week", value: analytics.weeklyQueries },
              { label: "Active Users Today", value: analytics.activeUsersToday },
              { label: "Avg Response (ms)", value: `${analytics.avgResponseMs}ms` },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Create User Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-end">
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Password</label>
                    <Input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      className="w-40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="bg-secondary rounded-md px-3 py-2 text-sm border border-input block"
                    >
                      <option value="USER">USER</option>
                      <option value="PRO">PRO</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <Button onClick={createUser}>Create</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={fetchData}>Search</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Queries</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          className="bg-secondary rounded px-2 py-1 text-xs"
                        >
                          <option value="USER">USER</option>
                          <option value="PRO">PRO</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3">{u._count.queries}</td>
                      <td className="p-3">
                        {u.banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </td>
                      <td className="p-3 space-x-2">
                        <Button
                          size="sm"
                          variant={u.banned ? "outline" : "destructive"}
                          onClick={() => toggleBan(u.id, !u.banned)}
                        >
                          {u.banned ? "Unban" : "Ban"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetPassword(u.id)}
                        >
                          Reset PW
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Models */}
        {tab === "models" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {models.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {m.name}:{m.tag}
                      </CardTitle>
                      {m.isDefault && <Badge>Default</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {!m.isDefault && (
                        <Button size="sm" variant="outline" onClick={() => setDefaultModel(m.id)}>
                          Set Default
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => deleteModelHandler(m.id)}>
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Queries */}
        {tab === "queries" && (
          <div className="text-muted-foreground">
            <p>Query browser — see the Overview tab for aggregate stats, or use the Users tab to view per-user queries.</p>
          </div>
        )}

        {/* Logs */}
        {tab === "logs" && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3">Path</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Duration</th>
                  <th className="text-left p-3">User</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="p-3 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{log.method}</Badge>
                    </td>
                    <td className="p-3 font-mono text-xs">{log.path}</td>
                    <td className="p-3">
                      <Badge variant={log.statusCode < 400 ? "secondary" : "destructive"}>
                        {log.statusCode}
                      </Badge>
                    </td>
                    <td className="p-3">{log.durationMs}ms</td>
                    <td className="p-3 text-xs">{log.user?.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
