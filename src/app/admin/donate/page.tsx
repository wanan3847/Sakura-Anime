"use client";

import { useEffect, useState, useRef } from "react";
import { Coffee, Upload, Trash2 } from "lucide-react";
import Loading from "@/components/common/Loading";

interface DonateImage {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
  user?: { name: string };
}

export default function AdminDonatePage() {
  const [images, setImages] = useState<DonateImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/donate");
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/donate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, caption }),
        });
        if (res.ok) {
          const data = await res.json();
          setImages((prev) => [data.image, ...prev]);
          setCaption("");
          if (fileRef.current) fileRef.current.value = "";
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该图片？")) return;
    try {
      const res = await fetch(`/api/donate?id=${id}`, { method: "DELETE" });
      if (res.ok) setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {}
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Coffee className="w-7 h-7 text-primary" />
        赞赏管理
      </h1>

      {/* 上传区域 */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <h2 className="text-sm font-semibold text-foreground">上传图片</h2>
        <p className="text-xs text-muted">上传的图片将展示在用户端的赞赏页面</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary-hover"
        />
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="说明文字（可选）"
          className="w-full h-9 px-4 rounded-lg bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "上传中..." : "上传"}
        </button>
      </div>

      {/* 图片列表 */}
      {images.length === 0 ? (
        <div className="text-center py-12 text-muted">暂无图片，请上传赞赏二维码或感谢图片</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="rounded-lg overflow-hidden bg-card border border-border group relative">
              <img src={img.url} alt={img.caption || "赞赏"} className="w-full aspect-square object-cover" />
              {img.caption && (
                <p className="p-2 text-xs text-muted truncate">{img.caption}</p>
              )}
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
