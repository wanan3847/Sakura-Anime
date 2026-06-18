"use client";

import { useEffect, useState } from "react";
import { Bug, Send, Trash2, CheckCircle } from "lucide-react";
import Loading from "@/components/common/Loading";

interface BugReport {
  id: string;
  text: string;
  createdAt: string;
  user?: { id: string; name: string };
  replies?: BugReport[];
}

export default function AdminBugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});

  const fetchBugs = async () => {
    try {
      const res = await fetch("/api/comments?animeId=bug-report&limit=100");
      if (res.ok) {
        const data = await res.json();
        const all = data.list || [];
        // Separate parent comments and replies
        const parents: BugReport[] = [];
        const replyMap: Record<string, BugReport[]> = {};
        for (const c of all) {
          if (c.parentId) {
            if (!replyMap[c.parentId]) replyMap[c.parentId] = [];
            replyMap[c.parentId].push(c);
          } else {
            parents.push(c);
          }
        }
        setReports(parents.map((p) => ({ ...p, replies: replyMap[p.id] || [] })));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBugs(); }, []);

  const handleReply = async (parentId: string) => {
    const text = replyText[parentId]?.trim();
    if (!text) return;
    setReplying((prev) => ({ ...prev, [parentId]: true }));
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: "bug-report", text, parentId }),
      });
      if (res.ok) {
        setReplyText((prev) => ({ ...prev, [parentId]: "" }));
        fetchBugs();
        // Also send a notification to the user who submitted the report
        const report = reports.find((r) => r.id === parentId);
        if (report?.user?.id) {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: report.user.id,
              title: "反馈回复",
              message: "管理员回复: " + text,
              type: "bug_reply",
            }),
          }).catch(() => {});
        }
      }
    } catch {} finally {
      setReplying((prev) => ({ ...prev, [parentId]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    try {
      await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      fetchBugs();
    } catch {}
  };

  const handleResolve = async (id: string) => {
    // Add a system reply to mark as resolved
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: "bug-report",
        text: "✅ 此问题已标记为已处理",
        parentId: id,
      }),
    });
    if (res.ok) fetchBugs();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bug className="w-7 h-7 text-red-400" />
          Bug 反馈管理
        </h1>
        <span className="text-sm text-muted">共 {reports.length} 条反馈</span>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 text-muted">暂无 Bug 反馈</div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl bg-card border border-border overflow-hidden">
              {/* Bug report */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted mb-2">
                      <span className="font-medium text-foreground">{report.user?.name || "匿名用户"}</span>
                      <span>·</span>
                      <span>{new Date(report.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{report.text}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleResolve(report.id)} className="p-1.5 text-muted hover:text-green-400 transition-colors" title="标记已处理">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(report.id)} className="p-1.5 text-muted hover:text-red-400 transition-colors" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {report.replies && report.replies.length > 0 && (
                <div className="bg-accent/20 px-4 py-2 space-y-2">
                  {report.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-medium shrink-0">管理员:</span>
                      <span className="text-foreground">{reply.text}</span>
                      <span className="text-[10px] text-muted shrink-0">
                        {new Date(reply.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              <div className="px-4 py-3 flex gap-2">
                <input
                  value={replyText[report.id] || ""}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [report.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleReply(report.id)}
                  placeholder="回复用户..."
                  className="flex-1 h-9 px-3 rounded-lg bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleReply(report.id)}
                  disabled={replying[report.id] || !replyText[report.id]?.trim()}
                  className="px-3 h-9 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  回复
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
