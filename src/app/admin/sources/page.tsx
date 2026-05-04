"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Wifi, WifiOff } from "lucide-react";
import Loading from "@/components/common/Loading";

interface VideoSource {
  id: string;
  name: string;
  apiUrl: string;
  isActive: boolean;
  priority: number;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", apiUrl: "", priority: 0 });

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await fetch("/api/admin/sources");
        if (res.ok) {
          setSources(await res.json());
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, []);

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isActive: true }),
      });
      if (res.ok) {
        const source = await res.json();
        setSources((prev) => [...prev, source]);
        setShowForm(false);
        setForm({ name: "", apiUrl: "", priority: 0 });
      }
    } catch {}
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">视频源管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          添加视频源
        </button>
      </div>

      {/* 添加表单 */}
      {showForm && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="源名称"
              className="h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              value={form.apiUrl}
              onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
              placeholder="API地址"
              className="h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
            />
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
              placeholder="优先级"
              className="h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm">
              保存
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-card hover:bg-card-hover text-muted rounded-lg text-sm">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 视频源列表 */}
      <div className="space-y-3">
        {sources.length === 0 ? (
          <div className="text-center py-20 text-muted">暂无视频源</div>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
            >
              {source.isActive ? (
                <Wifi className="w-5 h-5 text-green-400 shrink-0" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium">{source.name}</h3>
                <p className="text-muted text-xs truncate">{source.apiUrl}</p>
              </div>
              <span className="text-muted text-xs shrink-0">优先级: {source.priority}</span>
              <div className="flex gap-2 shrink-0">
                <button className="p-2 text-muted hover:text-white transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-muted hover:text-red-400 transition-colors">
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
