"use client";

import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";
import Loading from "@/components/common/Loading";

interface DonateImage {
  id: string;
  url: string;
  caption: string | null;
}

export default function DonatePage() {
  const [images, setImages] = useState<DonateImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/donate")
      .then((res) => res.json())
      .then((data) => setImages(data.images || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <Coffee className="w-16 h-16 text-primary mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">赞赏咖啡</h1>
        <p className="text-muted">所有赞赏将用于服务器租赁，感谢您的支持 ❤</p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
          {images.map((img) => (
            <div key={img.id} className="p-4 sm:p-6 rounded-xl bg-card border border-border text-center space-y-3">
              <img
                src={img.url}
                alt={img.caption || "赞赏"}
                className="w-full aspect-square object-contain rounded-lg"
              />
              {img.caption && (
                <p className="text-sm text-muted">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-card border border-border text-center space-y-4">
          <div className="w-48 h-48 mx-auto rounded-lg bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
            <div className="text-center">
              <Coffee className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted">暂未开放</p>
            </div>
          </div>
          <p className="text-sm text-muted">感谢您的支持</p>
        </div>
      )}
    </div>
  );
}
