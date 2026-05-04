"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, TrendingUp, Clock, Star } from "lucide-react";
import Loading from "@/components/common/Loading";
import { getAnimeCover } from "@/lib/utils";

interface AnimeItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  type_name: string;
}

const tabs = [
  { key: "hits", label: "最多播放", icon: TrendingUp },
  { key: "time", label: "最近更新", icon: Clock },
  { key: "score", label: "最高评分", icon: Star },
];

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState("hits");
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/anime?page=1&limit=50&sort=${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          setAnimes(data.list || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Trophy className="w-7 h-7 text-yellow-400" />
        排行榜
      </h1>

      {/* 标签切换 */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "bg-card hover:bg-card-hover text-muted"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 排行列表 */}
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {animes.map((anime, i) => (
            <Link
              key={anime.vod_id}
              href={`/anime/${anime.vod_id}`}
              className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-card-hover transition-colors"
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  i < 3
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                    : "bg-accent/50 text-muted"
                }`}
              >
                {i + 1}
              </span>
              <div className="relative w-12 h-16 rounded overflow-hidden shrink-0">
                <Image
                  src={anime.vod_pic || getAnimeCover(anime.vod_name)}
                  alt={anime.vod_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium truncate">{anime.vod_name}</h3>
                <p className="text-muted text-xs mt-1">
                  {[anime.type_name, anime.vod_year].filter(Boolean).join(" · ")}
                </p>
              </div>
              {anime.vod_remarks && (
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded shrink-0">
                  {anime.vod_remarks}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
