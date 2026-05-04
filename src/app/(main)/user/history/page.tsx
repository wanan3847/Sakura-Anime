"use client";

import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAnimeCover, formatDate } from "@/lib/utils";
import Loading from "@/components/common/Loading";

interface History {
  id: string;
  animeId: string;
  animeName: string;
  animeCover: string | null;
  episodeId: string | null;
  episodeName: string | null;
  progress: number;
  watchedAt: string;
}

export default function HistoryPage() {
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          setHistories(await res.json());
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Clock className="w-7 h-7 text-blue-400" />
        观看历史
      </h1>

      {histories.length === 0 ? (
        <div className="text-center py-20 text-muted">暂无观看记录</div>
      ) : (
        <div className="space-y-3">
          {histories.map((h) => (
            <Link
              key={h.id}
              href={`/anime/play/${h.animeId}?url=${encodeURIComponent(h.episodeId || "")}&name=${encodeURIComponent(h.episodeName || "")}`}
              className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-card-hover transition-colors"
            >
              <div className="relative w-16 h-20 rounded overflow-hidden shrink-0">
                <Image
                  src={h.animeCover || getAnimeCover(h.animeName)}
                  alt={h.animeName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium truncate">{h.animeName}</h3>
                {h.episodeName && (
                  <p className="text-primary text-xs mt-1">看到: {h.episodeName}</p>
                )}
                <p className="text-muted text-xs mt-1">{formatDate(h.watchedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
