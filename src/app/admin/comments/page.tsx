"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Trash2, Bug } from "lucide-react";
import Loading from "@/components/common/Loading";

interface CommentItem {
  id: string;
  text: string;
  animeId: string;
  episodeId: string | null;
  createdAt: string;
  user?: { name: string };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBugsOnly, setShowBugsOnly] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch("/api/comments");
      if (res.ok) setComments(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchComments(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  const filtered = showBugsOnly
    ? comments.filter((c) => c.animeId === "bug-report")
    : comments;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-primary" />
          评论管理
        </h1>
        <button
          onClick={() => setShowBugsOnly(!showBugsOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
            showBugsOnly ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-card text-muted border border-border"
          }`}
        >
          <Bug className="w-4 h-4" />
          {showBugsOnly ? "显示全部" : `Bug反馈 (${comments.filter(c => c.animeId === "bug-report").length})`}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">暂无评论</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((comment) => (
            <div key={comment.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{comment.user?.name || "匿名"}</span>
                  <span>·</span>
                  <span>{new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
                  {comment.animeId === "bug-report" && (
                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">Bug</span>
                  )}
                </div>
                <button onClick={() => handleDelete(comment.id)} className="text-muted hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
              {comment.animeId !== "bug-report" && comment.animeId && (
                <p className="text-xs text-muted mt-2">动漫ID: {comment.animeId}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
