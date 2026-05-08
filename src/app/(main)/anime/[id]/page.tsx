"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Play, Clock, Star } from "lucide-react";
import EpisodeList from "@/components/anime/EpisodeList";
import AnimeGrid from "@/components/anime/AnimeGrid";
import Loading from "@/components/common/Loading";
import { getAnimeCover } from "@/lib/utils";
import { parsePlaySources } from "@/lib/api";
import type { PlaySource, Episode } from "@/lib/api";

interface AnimeDetail {
  vod_id: string | number;
  vod_name: string;
  vod_pic: string;
  vod_year: string;
  vod_area: string;
  vod_remarks: string;
  vod_content: string;
  vod_play_from: string;
  vod_play_url: string;
  type_name: string;
  vod_time: string;
  vod_class: string;
  vod_score?: string;
  vod_director: string;
  vod_actor: string;
}

export default function AnimeDetailPage() {
  const params = useParams();
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [sources, setSources] = useState<PlaySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/anime/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setAnime(data);
          if (data.vod_play_from && data.vod_play_url) {
            setSources(parsePlaySources(data.vod_play_from, data.vod_play_url));
          }
        }
      } catch {
        // 使用示例数据
        const sample = getSampleDetail(params.id as string);
        setAnime(sample);
        if (sample.vod_play_from) {
          setSources(parsePlaySources(sample.vod_play_from, sample.vod_play_url));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id]);

  const handleFavorite = async () => {
    if (!anime) return;
    try {
      const animeId = String(anime.vod_id);
      if (isFavorited) {
        await fetch(`/api/favorites?animeId=${animeId}`, { method: "DELETE" });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animeId,
            animeName: anime.vod_name,
            animeCover: anime.vod_pic,
          }),
        });
      }
      setIsFavorited(!isFavorited);
    } catch {}
  };

  const handleEpisodeClick = (episode: Episode) => {
    window.location.href = `/anime/play/${params.id}?url=${encodeURIComponent(episode.url)}&name=${encodeURIComponent(episode.name)}`;
  };

  if (loading) return <Loading />;
  if (!anime) return <div className="text-center py-20 text-muted">动漫不存在</div>;

  const content = anime.vod_content?.replace(/<[^>]+>/g, "") || "暂无简介";

  return (
    <div className="space-y-8">
      {/* 顶部信息 */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* 封面 */}
        <div className="relative w-48 h-64 rounded-lg overflow-hidden shrink-0 mx-auto md:mx-0">
          <Image
            src={anime.vod_pic || getAnimeCover(anime.vod_name)}
            alt={anime.vod_name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* 信息 */}
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{anime.vod_name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            {anime.type_name && <span className="px-2 py-1 bg-card rounded">{anime.type_name}</span>}
            {anime.vod_area && <span className="px-2 py-1 bg-card rounded">{anime.vod_area}</span>}
            {anime.vod_year && <span className="px-2 py-1 bg-card rounded">{anime.vod_year}</span>}
            {anime.vod_class && <span className="px-2 py-1 bg-card rounded">{anime.vod_class}</span>}
            {anime.vod_score && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded flex items-center gap-1">
                <Star className="w-3 h-3" /> {anime.vod_score}
              </span>
            )}
          </div>
          {anime.vod_director && (
            <p className="text-sm text-muted">导演: {anime.vod_director}</p>
          )}
          {anime.vod_actor && (
            <p className="text-sm text-muted">主演: {anime.vod_actor}</p>
          )}
          <p className="text-gray-300 leading-relaxed">{content}</p>
          <div className="flex gap-3">
            {sources.length > 0 && sources[0].episodes.length > 0 && (
              <Link
                href={`/anime/play/${params.id}?url=${encodeURIComponent(sources[0].episodes[0].url)}&name=${encodeURIComponent(sources[0].episodes[0].name)}`}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                立即播放
              </Link>
            )}
            <button
              onClick={handleFavorite}
              className={`px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                isFavorited
                  ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                  : "bg-card hover:bg-card-hover text-muted"
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              {isFavorited ? "已收藏" : "收藏"}
            </button>
          </div>
        </div>
      </div>

      {/* 剧集列表 */}
      {sources.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            选集播放
          </h2>
          <EpisodeList
            sources={sources}
            onEpisodeClick={handleEpisodeClick}
          />
        </section>
      )}

      {/* 相关推荐 */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          相关推荐
        </h2>
        <AnimeGrid animes={[]} />
      </section>
    </div>
  );
}

function getSampleDetail(id: string): AnimeDetail {
  return {
    vod_id: id,
    vod_name: "示例动漫",
    vod_pic: "",
    vod_year: "2024",
    vod_area: "日本",
    vod_remarks: "全集",
    vod_content: "这是一部精彩的动漫作品，讲述了主人公的冒险故事。",
    vod_play_from: "线路1$$$线路2",
    vod_play_url: "第01集$https://example.com/ep1.m3u8#第02集$https://example.com/ep2.m3u8#第03集$https://example.com/ep3.m3u8$$$第01集$https://backup.com/ep1.m3u8#第02集$https://backup.com/ep2.m3u8",
    type_name: "日本动漫",
    vod_time: "2024-01-01",
    vod_class: "热血",
    vod_director: "示例导演",
    vod_actor: "示例演员",
  };
}
