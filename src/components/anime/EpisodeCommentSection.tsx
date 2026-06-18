"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, Trash2, Reply, ChevronDown, ChevronUp } from "lucide-react";

interface CommentUser {
  id: string;
  name: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  animeId: string;
  episodeId: string | null;
  text: string;
  rating: number | null;
  parentId: string | null;
  userId: string | null;
  createdAt: string;
  user: CommentUser | null;
  replies: Comment[];
}

interface EpisodeCommentSectionProps {
  animeId: string;
  episodeId: string;
}

export default function EpisodeCommentSection({ animeId, episodeId }: EpisodeCommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?animeId=${animeId}&episodeId=${encodeURIComponent(episodeId)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.list || []);
        setTotal(data.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchComments(); }, [animeId, episodeId]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, episodeId, text }),
      });
      if (res.ok) {
        const newComment = await res.json();
        newComment.replies = [];
        setComments(prev => [newComment, ...prev]);
        setTotal(prev => prev + 1);
        setText("");
      }
    } catch {} finally { setSubmitting(false); }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId, episodeId, text: replyText, parentId }),
      });
      if (res.ok) {
        const newReply = await res.json();
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...c.replies, newReply] };
          }
          return c;
        }));
        setReplyText("");
        setReplyTo(null);
        setExpandedReplies(prev => new Set([...prev, parentId]));
      }
    } catch {} finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条评论？")) return;
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setComments(prev => {
          const filtered = prev.filter(c => c.id !== id);
          return filtered.map(c => ({
            ...c,
            replies: c.replies.filter(r => r.id !== id),
          }));
        });
        setTotal(prev => prev - 1);
      }
    } catch {}
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return d.toLocaleDateString("zh-CN");
  };

  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">剧集评论</h2>
        <span className="text-sm text-muted">({total})</span>
      </div>

      {/* 发表评论 */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={session?.user ? "说说你对这一集的看法..." : "登录后即可评论..."}
            disabled={!session?.user}
            rows={3}
            className="flex-1 px-4 py-3 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary resize-none disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!session?.user || !text.trim() || submitting}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {submitting ? "发送中..." : "发表评论"}
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-8 text-muted">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无剧集评论，来抢沙发吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {comment.user?.name?.slice(0, 1) || "匿"}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {comment.user?.name || "匿名用户"}
                    </span>
                    <span className="text-xs text-muted">{formatDate(comment.createdAt)}</span>
                  </div>
                  {/* Content */}
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="text-xs text-muted hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" /> 回复
                    </button>
                    {(userId === comment.userId || userRole === "admin") && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 删除
                      </button>
                    )}
                  </div>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 mb-2"
                      >
                        {expandedReplies.has(comment.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {comment.replies.length} 条回复
                      </button>
                      {expandedReplies.has(comment.id) && (
                        <div className="space-y-3 pl-2 border-l-2 border-border ml-1">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {reply.user?.name?.slice(0, 1) || "匿"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-medium text-foreground">{reply.user?.name || "匿名用户"}</span>
                                  <span className="text-[10px] text-muted">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-xs text-foreground/80">{reply.text}</p>
                                {(userId === reply.userId || userRole === "admin") && (
                                  <button onClick={() => handleDelete(reply.id)} className="text-[10px] text-muted hover:text-red-400 mt-1">删除</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleReply(comment.id)}
                        placeholder={`回复 ${comment.user?.name || "匿名用户"}...`}
                        className="flex-1 h-8 px-3 rounded-lg bg-accent/50 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim() || submitting}
                        className="px-3 h-8 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs disabled:opacity-50"
                      >
                        回复
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
