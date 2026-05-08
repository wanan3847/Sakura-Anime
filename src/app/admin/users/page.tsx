"use client";

import { useEffect, useState } from "react";
import { Users, Shield, User, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Loading from "@/components/common/Loading";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${p}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`确定将该用户角色切换为「${newRole === "admin" ? "管理员" : "用户"}」？`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
        );
      } else {
        const data = await res.json();
        alert(data.error || "操作失败");
      }
    } catch {}
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("确定删除该用户？此操作不可恢复。")) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTotal((prev) => prev - 1);
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch {}
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Users className="w-7 h-7 text-blue-400" />
        用户管理
        <span className="text-sm font-normal text-muted">({total}人)</span>
      </h1>

      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-20 text-muted">暂无用户</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center shrink-0">
                {user.role === "admin" ? (
                  <Shield className="w-5 h-5 text-yellow-400" />
                ) : (
                  <User className="w-5 h-5 text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-foreground text-sm font-medium">{user.name || "未设置"}</h3>
                <p className="text-muted text-xs">{user.email}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                user.role === "admin"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-accent/50 text-muted"
              }`}>
                {user.role === "admin" ? "管理员" : "用户"}
              </span>
              <span className="text-muted text-xs shrink-0">
                {new Date(user.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggleRole(user.id, user.role)}
                  className="p-2 text-muted hover:text-yellow-400 transition-colors"
                  title={user.role === "admin" ? "降为用户" : "升为管理员"}
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-muted hover:text-red-400 transition-colors"
                  title="删除用户"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-muted text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg bg-card border border-border text-muted hover:text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
