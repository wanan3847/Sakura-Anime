"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Plus, Trash2, Save, Edit, Search, X, RefreshCw, AlertTriangle } from "lucide-react";
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

interface CatalogItem {
  vod_id: string | number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
}

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 从当前月份推算季度
function getCurrentQuarter(): number {
  return Math.floor((new Date().getMonth()) / 3) + 1;
}

// 季度标签
const QUARTER_LABELS: Record<number, string> = {
  1: "1月番 (冬)",
  2: "4月番 (春)",
  3: "7月番 (夏)",
  4: "10月番 (秋)",
};

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPages, setCatalogPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [useFallback, setUseFallback] = useState(false);
  const [form, setForm] = useState({
    animeId: "",
    animeName: "",
    animePic: "",
    dayOfWeek: 1,
    timeSlot: "",
    remark: "",
  });

  // 筛选条件
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterQuarter, setFilterQuarter] = useState(getCurrentQuarter());
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/admin/schedule");
      if (res.ok) setSchedules(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  // 从本地目录查询动漫
  const fetchCatalog = useCallback(async (page = 1) => {
    setSearching(true);
    setUseFallback(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "30",
        year: String(filterYear),
        quarter: String(filterQuarter),
      });
      if (searchKeyword.trim()) {
        params.set("q", searchKeyword.trim());
      }
      const res = await fetch(`/api/catalog?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.list && data.list.length > 0) {
          setCatalogItems(data.list);
          setCatalogTotal(data.total);
          setCatalogPage(data.page);
          setCatalogPages(data.pagecount);
          setUseFallback(false);
        } else if (!searchKeyword.trim()) {
          // 本地查不到 → fallback 到 CMS API
          setUseFallback(true);
          fetchFallback(page);
        } else {
          setCatalogItems([]);
          setCatalogTotal(0);
        }
      }
    } catch {
      setUseFallback(true);
      fetchFallback(page);
    } finally {
      setSearching(false);
    }
  }, [filterYear, filterQuarter, searchKeyword]);

  // Fallback: 直接调 CMS API
  const fetchFallback = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "30",
        sort: "time",
        type: "日本动漫",
      });
      const res = await fetch(`/api/anime?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCatalogItems(data.list || []);
        setCatalogTotal(data.total || 0);
        setCatalogPage(data.page || 1);
        setCatalogPages(data.pagecount || 1);
      }
    } catch {}
  };

  // 获取可用年份列表
  const fetchYears = async () => {
    try {
      const res = await fetch("/api/catalog?limit=1&sort=year");
      if (res.ok) {
        // 用已知的年份范围（硬编码合理范围）
        const years: number[] = [];
        for (let y = currentYear; y >= 2000; y--) years.push(y);
        setAvailableYears(years);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSchedules();
    fetchYears();
  }, []);

  // 筛选条件变化时重新查询
  useEffect(() => {
    if (showForm) fetchCatalog(1);
  }, [filterYear, filterQuarter, showForm, fetchCatalog]);

  // 同步最新数据
  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("正在同步...");
    try {
      const res = await fetch("/api/admin/crawl?quick=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "crawl-sakura-2026" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSyncMessage(`同步完成，更新 ${data.total} 条数据`);
        fetchCatalog(1);
      } else {
        setSyncMessage("同步失败");
      }
    } catch {
      setSyncMessage("同步请求失败");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 3000);
    }
  };

  const selectAnime = (item: CatalogItem) => {
    setForm({
      ...form,
      animeId: String(item.vod_id),
      animeName: item.vod_name,
      animePic: item.vod_pic || "",
    });
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
        setShowForm(false);
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

  const handleDeleteAll = async () => {
    if (!confirm("确定清空所有排期？此操作不可撤销！")) return;
    try {
      const res = await fetch("/api/admin/schedule?all=true", { method: "DELETE" });
      if (res.ok) setSchedules([]);
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

  const totalItems = Object.values(
    schedules.reduce<Record<number, ScheduleItem[]>>((acc, s) => {
      if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
      acc[s.dayOfWeek].push(s);
      return acc;
    }, {})
  ).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-7 h-7 text-primary" />
          排期管理
          <span className="text-sm font-normal text-muted">({totalItems} 部)</span>
        </h1>
        <div className="flex items-center gap-2">
          {/* 同步按钮 */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-2 bg-card hover:bg-card-hover border border-border text-foreground rounded-lg transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "同步中..." : "同步最新"}
          </button>
          {syncMessage && (
            <span className="text-xs text-primary">{syncMessage}</span>
          )}
          {/* 清空按钮 */}
          {totalItems > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
            >
              <Trash2 className="w-4 h-4" /> 清空所有
            </button>
          )}
          {/* 添加按钮 */}
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ animeId: "", animeName: "", animePic: "", dayOfWeek: 1, timeSlot: "", remark: "" }); }}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> 添加排期
          </button>
        </div>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          {/* 年份+季度筛选 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-xs text-muted mb-1 block">年份</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="h-9 px-3 rounded-lg bg-accent/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">季度</label>
              <select
                value={filterQuarter}
                onChange={(e) => setFilterQuarter(parseInt(e.target.value))}
                className="h-9 px-3 rounded-lg bg-accent/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
                ))}
              </select>
            </div>
            {useFallback && (
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <AlertTriangle className="w-3 h-3" />
                本地无此季数据，显示 CMS 实时结果
              </div>
            )}
          </div>

          {/* 搜索动漫 */}
          <div>
            <label className="text-sm text-muted mb-2 block">搜索动漫</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCatalog(1)}
                placeholder="输入动漫名称搜索..."
                className="flex-1 h-10 px-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => fetchCatalog(1)}
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
                <img src={form.animePic} alt="" className="w-8 h-10 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
              {searchKeyword ? `搜索结果 (${catalogTotal})` : `${filterYear}年 ${QUARTER_LABELS[filterQuarter]} (${catalogTotal})`}
              {useFallback && <span className="text-yellow-500 ml-2">[实时数据]</span>}
            </label>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-card">
              {catalogItems.length === 0 && !searching ? (
                <p className="p-3 text-muted text-sm text-center">暂无数据，点击「同步最新」获取</p>
              ) : (
                catalogItems.map((item) => (
                  <button
                    key={String(item.vod_id)}
                    onClick={() => selectAnime(item)}
                    className={`w-full text-left px-3 py-2 hover:bg-accent/50 text-sm border-b border-border last:border-0 flex items-center gap-3 ${
                      String(item.vod_id) === form.animeId ? "bg-primary/10" : ""
                    }`}
                  >
                    {item.vod_pic ? (
                      <img src={item.vod_pic} alt="" className="w-8 h-10 object-cover rounded shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-8 h-10 bg-accent rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground truncate block">{item.vod_name}</span>
                      <span className="text-muted text-xs">{item.vod_remarks || item.vod_year}</span>
                    </div>
                  </button>
                ))
              )}
              {searching && <p className="p-3 text-muted text-sm text-center">加载中...</p>}
            </div>
          </div>

          {/* 分页 */}
          {catalogPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => fetchCatalog(catalogPage - 1)}
                disabled={catalogPage <= 1}
                className="px-3 py-1 rounded bg-accent/50 text-sm text-muted disabled:opacity-30"
              >
                上一页
              </button>
              <span className="text-xs text-muted">{catalogPage} / {catalogPages}</span>
              <button
                onClick={() => fetchCatalog(catalogPage + 1)}
                disabled={catalogPage >= catalogPages}
                className="px-3 py-1 rounded bg-accent/50 text-sm text-muted disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}

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
                        <img src={item.animePic} alt="" className="w-10 h-14 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
