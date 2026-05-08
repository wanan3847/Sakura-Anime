"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, Save, Edit, Search, X } from "lucide-react";
import Loading from "@/components/common/Loading";

interface ScheduleItem {
  id: string;
  animeId: string;
  animeName: string;
  animePic: string | null;
  dayOfWeek: number;
  timeSlot: string | null;
  remark: string | null;
}

interface AnimeItem {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
}

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<AnimeItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    animeId: "",
    animeName: "",
    animePic: "",
    dayOfWeek: 1,
    timeSlot: "",
    remark: "",
  });

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/admin/schedule");
      if (res.ok) setSchedules(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchRecentAnime = async () => {
    try {
      const res = await fetch("/api/anime?page=1&limit=30&sort=time&type=日本动漫");
      if (res.ok) {
        const data = await res.json();
        setAnimeList(data.list || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSchedules();
    fetchRecentAnime();
  }, []);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchKeyword.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.list || []);
      }
    } catch {} finally {
      setSearching(false);
    }
  };

  const selectAnime = (item: AnimeItem) => {
    setForm({
      ...form,
      animeId: String(item.vod_id),
      animeName: item.vod_name,
      animePic: item.vod_pic,
    });
    setSearchResults([]);
    setSearchKeyword("");
  };

  const handleAdd = async () => {
    if (!form.animeId || !form.animeName) return;
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const item = await res.json();
        setSchedules((prev) => [...prev, item]);
        setShowForm(false);
        setForm({ animeId: "", animeName: "", animePic: "", dayOfWeek: 1, timeSlot: "", remark: "" });
      }
    } catch {}
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSchedules((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        setEditingId(null);
        setForm({ animeId: "", animeName: "", animePic: "", dayOfWeek: 1, timeSlot: "", remark: "" });
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该排期？")) return;
    try {
      const res = await fetch(`/api/admin/schedule?id=${id}`, { method: "DELETE" });
      if (res.ok) setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setShowForm(true);
    setForm({
      animeId: item.animeId,
      animeName: item.animeName,
      animePic: item.animePic || "",
      dayOfWeek: item.dayOfWeek,
      timeSlot: item.timeSlot || "",
      remark: item.remark || "",
    });
  };

  if (loading) return <Loading />;

  // 合并搜索结果和最近动漫列表（去重）
  const displayList = searchResults.length > 0
    ? searchResults
    : animeList;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-7 h-7 text-primary" />
          排期管理
        </h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ animeId: "", animeName: "", animePic: "", dayOfWeek: 1, timeSlot: "", remark: "" }); }}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> 添加排期
        </button>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          {/* 搜索动漫 */}
          <div>
            <label className="text-sm text-muted mb-2 block">搜索动漫</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="输入动漫名称搜索..."
                className="flex-1 h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-3 h-10 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 已选动漫 */}
          {form.animeName && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
              {form.animePic && (
                <img src={form.animePic} alt="" className="w-8 h-10 object-cover rounded" />
              )}
              <span className="text-sm text-foreground font-medium">{form.animeName}</span>
              <button onClick={() => setForm({ ...form, animeId: "", animeName: "", animePic: "" })} className="ml-auto text-muted hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 动漫列表 */}
          <div>
            <label className="text-sm text-muted mb-2 block">
              {searchResults.length > 0 ? `搜索结果 (${searchResults.length})` : `最近更新 (${animeList.length})`}
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
              {displayList.length === 0 ? (
                <p className="p-3 text-muted text-sm text-center">暂无数据</p>
              ) : (
                displayList.map((item) => (
                  <button
                    key={item.vod_id}
                    onClick={() => selectAnime(item)}
                    className={`w-full text-left px-3 py-2 hover:bg-accent/50 text-sm border-b border-border last:border-0 flex items-center gap-3 ${
                      String(item.vod_id) === form.animeId ? "bg-primary/10" : ""
                    }`}
                  >
                    {item.vod_pic ? (
                      <img src={item.vod_pic} alt="" className="w-8 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-8 h-10 bg-accent rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground truncate block">{item.vod_name}</span>
                      <span className="text-muted text-xs">{item.vod_remarks}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 星期、时间、备注 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">星期</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                className="w-full h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">时间</label>
              <input
                type="text"
                value={form.timeSlot}
                onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                placeholder="如 22:00"
                className="w-full h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">备注</label>
              <input
                type="text"
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                placeholder="可选"
                className="w-full h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-2">
            <button onClick={editingId ? handleUpdate : handleAdd} disabled={!form.animeId} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50">
              <Save className="w-4 h-4" /> {editingId ? "更新" : "添加"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-card hover:bg-card-hover text-muted rounded-lg text-sm">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 排期列表 */}
      <div className="space-y-6">
        {DAY_NAMES.map((dayName, dayIdx) => {
          const dayItems = schedules.filter((s) => s.dayOfWeek === dayIdx);
          return (
            <div key={dayIdx}>
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                {dayName}
                <span className="text-sm font-normal text-muted">({dayItems.length})</span>
              </h2>
              {dayItems.length === 0 ? (
                <p className="text-muted text-sm py-2">暂无排期</p>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                      {item.animePic && (
                        <img src={item.animePic} alt="" className="w-10 h-14 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-foreground text-sm font-medium">{item.animeName}</h3>
                        <p className="text-muted text-xs">
                          {item.timeSlot && `${item.timeSlot} · `}
                          {item.remark || `ID: ${item.animeId}`}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(item)} className="p-2 text-muted hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-muted hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
