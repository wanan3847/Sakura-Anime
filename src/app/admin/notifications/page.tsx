"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send, Trash2, Loader2 } from "lucide-react";
import Loading from "@/components/common/Loading";

interface Notification {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetUserId, setTargetUserId] = useState(""); // empty = all users
  const [type, setType] = useState("system");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [notifRes, usersRes] = await Promise.all([
        fetch("/api/notifications?limit=100"),
        fetch("/api/admin/users?limit=200"),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.list || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId || "all",
          title: title.trim(),
          message: message.trim(),
          type,
        }),
      });
      if (res.ok) {
        setTitle("");
        setMessage("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "创建失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此通知？")) return;
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {
      // ignore
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-orange-400" />
          公告管理
        </h1>
        <span className="text-sm text-muted">
          共 {notifications.length} 条通知
        </span>
      </div>

      {/* Create form */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">发布通知</h2>

        <div>
          <label className="block text-sm text-muted mb-1">类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary"
          >
            <option value="system">系统通知</option>
            <option value="announcement">公告</option>
            <option value="bug_reply">Bug 回复</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">标题</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="通知标题"
            className="w-full h-10 px-3 rounded-lg bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">消息内容</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入通知内容..."
            rows={4}
            className="w-full rounded-lg bg-accent/50 border border-border p-3 text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">
            发送目标
          </label>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary"
          >
            <option value="">所有用户（全站公告）</option>
            <option value="all">所有用户（等价）</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting || !title.trim() || !message.trim()}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {submitting ? "发布中..." : "发布通知"}
        </button>
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted">暂无通知</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="rounded-xl bg-card border border-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted mb-1">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        notif.type === "announcement"
                          ? "bg-orange-100 text-orange-600"
                          : notif.type === "bug_reply"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {notif.type === "announcement"
                        ? "公告"
                        : notif.type === "bug_reply"
                          ? "Bug回复"
                          : "系统通知"}
                    </span>
                    <span>·</span>
                    <span>{new Date(notif.createdAt).toLocaleString("zh-CN")}</span>
                    <span>·</span>
                    <span>
                      {notif.userId ? `私发给: ${notif.user?.name || "用户"}` : "全站公告"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-muted mt-1 whitespace-pre-wrap">
                    {notif.message}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-1.5 text-muted hover:text-red-400 transition-colors shrink-0"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
