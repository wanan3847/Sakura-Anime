"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bug, Send, CheckCircle, MessageSquare } from "lucide-react";

interface FeedbackItem {
  id: string;
  text: string;
  createdAt: string;
  userId: string | null;
  parentId?: string | null;
  user?: { id: string; name: string };
  replies?: FeedbackItem[];
}

export default function FeedbackPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myReports, setMyReports] = useState<FeedbackItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchMyReports = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/comments?animeId=bug-report&limit=200");
      if (res.ok) {
        const data = await res.json();
        const all: FeedbackItem[] = data.list || [];
        // Filter by current user
        const mine = all.filter((c) => c.userId === userId);
        // Attach replies (comments with parentId that match our IDs)
        const replyMap: Record<string, FeedbackItem[]> = {};
        for (const c of all) {
          if (c.parentId) {
            if (!replyMap[c.parentId]) replyMap[c.parentId] = [];
            replyMap[c.parentId].push(c);
          }
        }
        setMyReports(
          mine.map((p) => ({ ...p, replies: replyMap[p.id] || [] }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (session?.user) fetchMyReports();
  }, [session]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: "bug-report", text: text.trim() }),
      });
      if (res.ok) {
        setSubmitted(true);
        setText("");
        fetchMyReports();
      } else {
        alert("提交失败，请重试");
      }
    } catch {
      alert("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">感谢反馈！</h1>
        <p className="text-muted">我们已收到您的反馈，会尽快处理。</p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-primary text-sm hover:underline"
        >
          再提一条
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <Bug className="w-12 h-12 text-red-400 mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">反馈</h1>
        <p className="text-sm text-muted">
          遇到问题或有建议？告诉我们，我们会尽快回复。
        </p>
      </div>

      {/* Submit form */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="描述您遇到的问题或建议..."
          rows={6}
          className="w-full rounded-lg border border-border bg-accent/50 p-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? "提交中..." : "提交反馈"}
        </button>
      </div>

      {/* History of my reports */}
      {session?.user && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-muted" />
            我的反馈记录
          </h2>

          {loadingHistory ? (
            <div className="text-center py-8 text-muted text-sm">加载中...</div>
          ) : myReports.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              暂无反馈记录
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl bg-card border border-border overflow-hidden"
                >
                  {/* Report */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted mb-2">
                      <span className="font-medium text-foreground">我</span>
                      <span>·</span>
                      <span>
                        {new Date(report.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {report.text}
                    </p>
                  </div>

                  {/* Admin replies */}
                  {report.replies && report.replies.length > 0 && (
                    <div className="bg-accent/20 px-4 py-2 space-y-2 border-t border-border">
                      {report.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="flex items-start gap-2 text-sm ml-4 pl-3 border-l-2 border-primary/30"
                        >
                          <span className="text-primary font-medium shrink-0">
                            管理员回复:
                          </span>
                          <span className="text-foreground">
                            {reply.text}
                          </span>
                          <span className="text-[10px] text-muted shrink-0">
                            {new Date(reply.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
