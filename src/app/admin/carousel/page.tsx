"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, GripVertical, Search, X, Check, Upload } from "lucide-react";
import Loading from "@/components/common/Loading";

interface CarouselItem {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  badge: string | null;
  order: number;
  isActive: boolean;
}

interface CatalogItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_score: string;
}

export default function CarouselAdminPage() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", subtitle: "", badge: "" });
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/carousel");
      if (res.ok) setItems(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  // 从目录搜索动漫
  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/catalog?limit=20&q=${encodeURIComponent(searchQ)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.list || []);
      }
    } catch {} finally { setSearching(false); }
  };

  // 从目录导入动漫到轮播
  const handleImport = async (anime: CatalogItem) => {
    try {
      const res = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: anime.vod_name,
          subtitle: anime.vod_remarks || "",
          imageUrl: anime.vod_pic || "",
          linkUrl: `/anime/${anime.vod_id}`,
          badge: anime.vod_score && parseFloat(anime.vod_score) > 0 ? `${anime.vod_score}分` : "",
          order: items.length,
        }),
      });
      if (res.ok) {
        fetchItems();
        // 从搜索结果中标记已添加
        setSearchResults(prev => prev.filter(r => r.vod_id !== anime.vod_id));
      }
    } catch {}
  };

  const handleUpdate = async (id: string, data: Partial<CarouselItem>) => {
    try {
      await fetch("/api/admin/carousel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    try {
      const res = await fetch(`/api/admin/carousel?id=${id}`, { method: "DELETE" });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } catch {}
  };

  const startEdit = (item: CarouselItem) => {
    setEditingId(item.id);
    setEditForm({ title: item.title, subtitle: item.subtitle || "", badge: item.badge || "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await handleUpdate(editingId, editForm);
    setEditingId(null);
  };

  const handleUploadImage = (item: CarouselItem, file: File) => {
    setUploadingId(item.id);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { url } = JSON.parse(xhr.responseText);
          await handleUpdate(item.id, { imageUrl: url });
        } catch {}
      }
      setUploadingId(null);
      setUploadProgress(0);
    });

    xhr.addEventListener("error", () => {
      setUploadingId(null);
      setUploadProgress(0);
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">轮播图管理</h1>
        <button onClick={() => setShowImport(!showImport)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center gap-1.5 text-sm font-medium">
          <Plus className="w-4 h-4" /> 从目录导入
        </button>
      </div>

      {/* 从目录导入面板 */}
      {showImport && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">搜索动漫目录导入</h3>
            <button onClick={() => { setShowImport(false); setSearchResults([]); setSearchQ(""); }}>
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="搜索动漫名称..." className="w-full h-9 pl-9 pr-4 rounded-lg bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
            <button onClick={handleSearch} disabled={searching}
              className="px-4 h-9 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm disabled:opacity-50">
              {searching ? "搜索中..." : "搜索"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {searchResults.map(anime => {
                const alreadyAdded = items.some(i => i.linkUrl === `/anime/${anime.vod_id}`);
                return (
                  <div key={anime.vod_id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    {anime.vod_pic ? (
                      <img src={anime.vod_pic} alt="" className="w-10 h-14 object-cover rounded shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-10 h-14 rounded bg-accent shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{anime.vod_name}</p>
                      <p className="text-[10px] text-muted">{anime.vod_year} {anime.vod_remarks}</p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-[10px] text-green-500 flex items-center gap-0.5 shrink-0"><Check className="w-3 h-3" />已添加</span>
                    ) : (
                      <button onClick={() => handleImport(anime)}
                        className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded text-[10px] shrink-0">
                        + 添加
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {searchResults.length === 0 && searchQ && !searching && (
            <p className="text-center text-muted text-sm py-4">未找到结果</p>
          )}
        </div>
      )}

      {/* 轮播图列表 */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-16 text-muted space-y-2">
            <p className="text-sm">暂无轮播图</p>
            <p className="text-xs">点击「从目录导入」添加动漫到轮播</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <GripVertical className="w-4 h-4 text-muted shrink-0 cursor-grab" />

              {/* 预览图 */}
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-24 h-14 object-cover rounded-lg shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-24 h-14 rounded-lg bg-accent/50 shrink-0 flex items-center justify-center text-[10px] text-muted">无图</div>
              )}

              {/* 上传图片 */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <input type="file" accept="image/*" className="hidden"
                  id={`upload-${item.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(item, file);
                    e.target.value = "";
                  }} />
                <button onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                  disabled={uploadingId === item.id}
                  className="flex flex-col items-center gap-0.5 text-muted hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  title="上传图片">
                  {uploadingId === item.id ? (
                    <span className="text-[10px] font-mono">{uploadProgress}%</span>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </button>
                {uploadingId === item.id && (
                  <div className="w-8 h-1 rounded-full bg-accent overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-200 rounded-full"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  <div className="flex flex-col gap-1">
                    <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                      className="h-7 px-2 rounded bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary" placeholder="标题" />
                    <input value={editForm.subtitle} onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                      className="h-7 px-2 rounded bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary" placeholder="副标题" />
                    <input value={editForm.badge} onChange={e => setEditForm({...editForm, badge: e.target.value})}
                      className="h-7 px-2 rounded bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary w-24" placeholder="标签" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.badge && <span className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded mr-1.5">{item.badge}</span>}
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted truncate">{item.subtitle || item.linkUrl || "-"}</p>
                  </>
                )}
              </div>

              {/* 排序 */}
              <input type="number" defaultValue={item.order}
                onBlur={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v !== item.order) handleUpdate(item.id, { order: v }); }}
                className="w-12 h-7 px-1 rounded bg-accent/50 border border-border text-xs text-center focus:outline-none focus:border-primary" title="排序" />

              {/* 编辑/保存 */}
              {editingId === item.id ? (
                <button onClick={saveEdit} className="px-2 py-1 bg-primary text-white rounded text-[10px]">保存</button>
              ) : (
                <button onClick={() => startEdit(item)} className="text-muted hover:text-primary text-[10px] px-1">编辑</button>
              )}

              {/* 启用/禁用 */}
              <button onClick={() => handleUpdate(item.id, { isActive: !item.isActive })} title={item.isActive ? "禁用" : "启用"}>
                {item.isActive ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
              </button>

              {/* 删除 */}
              <button onClick={() => handleDelete(item.id)} className="text-muted hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 提示 */}
      {items.length > 0 && (
        <p className="text-[10px] text-muted text-center">拖拽排序 · 编辑标题/副标题 · 调整序号改变顺序 · 主页轮播会自动轮播显示</p>
      )}
    </div>
  );
}
