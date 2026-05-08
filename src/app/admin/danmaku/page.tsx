"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Loading from "@/components/common/Loading";

interface DanmakuData {
  id: string;
  animeId: string;
  episodeId: string;
  text: string;
  color: string;
  type: number;
  time: number;
  userId: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

export default function DanmakuPage() {
  const [danmakus, setDanmakus] = useState<DanmakuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = 20;

  const fetchDanmakus = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/danmaku?page=${p}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setDanmakus(data.danmakus);
        setTotal(data.total);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDanmakus(page);
    setSelected(new Set());
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该弹幕？")) return;
    try {
      const res = await fetch(`/api/admin/danmaku?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDanmakus((prev) => prev.filter((d) => d.id !== id));
        setTotal((prev) => prev - 1);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch {}
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确定删除选中的 ${selected.size} 条弹幕？`)) return;
    try {
      const res = await fetch("/api/admin/danmaku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        setDanmakus((prev) => prev.filter((d) => !selected.has(d.id)));
        setTotal((prev) => prev - selected.size);
        setSelected(new Set());
      }
    } catch {}
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === danmakus.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(danmakus.map((d) => d.id)));
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-yellow-400" />
          弹幕管理
          <span className="text-sm font-normal text-muted">({total}条)</span>
        </h1>
        {selected.size > 0 && (
          <button
            onClick={handleBatchDelete}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
          >
            删除选中 ({selected.size})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {danmakus.length === 0 ? (
          <div className="text-center py-20 text-muted">暂无弹幕</div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2">
              <input
                type="checkbox"
                checked={selected.size === danmakus.length && danmakus.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-muted text-xs">全选</span>
            </div>

            {danmakus.map((danmaku) => (
              <div
                key={danmaku.id}
                className={`flex items-center gap-4 p-4 rounded-lg bg-card border transition-colors ${
                  selected.has(danmaku.id) ? "border-primary" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(danmaku.id)}
                  onChange={() => toggleSelect(danmaku.id)}
                  className="w-4 h-4 rounded border-border shrink-0"
                />
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: danmaku.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm">{danmaku.text}</p>
                  <p className="text-muted text-xs mt-1">
                    动漫ID: {danmaku.animeId} · 集ID: {danmaku.episodeId} ·
                    时间: {Math.floor(danmaku.time)}s ·
                    {danmaku.user?.name || "匿名用户"}
                  </p>
                </div>
                <span className="text-muted text-xs shrink-0">
                  {new Date(danmaku.createdAt).toLocaleDateString("zh-CN")}
                </span>
                <button
                  onClick={() => handleDelete(danmaku.id)}
                  className="p-2 text-muted hover:text-red-400 transition-colors shrink-0"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </>
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
