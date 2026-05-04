"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import VideoPlayer from "@/components/anime/VideoPlayer";
import EpisodeList from "@/components/anime/EpisodeList";
import Loading from "@/components/common/Loading";
import { parsePlaySources } from "@/lib/api";
import type { PlaySource, Episode } from "@/lib/api";

function PlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [sources, setSources] = useState<PlaySource[]>([]);
  const [currentUrl, setCurrentUrl] = useState(searchParams.get("url") || "");
  const [currentName, setCurrentName] = useState(searchParams.get("name") || "");
  const [animeName, setAnimeName] = useState("");
  const [danmakuInput, setDanmakuInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/anime/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setAnimeName(data.vod_name);
          if (data.vod_play_from && data.vod_play_url) {
            const parsed = parsePlaySources(data.vod_play_from, data.vod_play_url);
            setSources(parsed);
            if (!currentUrl && parsed.length > 0 && parsed[0].episodes.length > 0) {
              setCurrentUrl(parsed[0].episodes[0].url);
              setCurrentName(parsed[0].episodes[0].name);
            }
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id, currentUrl]);

  const handleEpisodeClick = useCallback((episode: Episode) => {
    setCurrentUrl(episode.url);
    setCurrentName(episode.name);
    // 更新URL但不刷新页面
    const url = new URL(window.location.href);
    url.searchParams.set("url", episode.url);
    url.searchParams.set("name", episode.name);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleSendDanmaku = async () => {
    if (!danmakuInput.trim()) return;
    try {
      await fetch("/api/danmaku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId: params.id,
          episodeId: currentUrl,
          text: danmakuInput,
          time: 0,
          color: "#ffffff",
          type: 0,
        }),
      });
      setDanmakuInput("");
    } catch {}
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center gap-4">
        <Link
          href={`/anime/${params.id}`}
          className="flex items-center gap-2 text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回详情
        </Link>
        {animeName && (
          <span className="text-muted">·</span>
        )}
        {animeName && (
          <span className="text-white font-medium">{animeName}</span>
        )}
        {currentName && (
          <>
            <span className="text-muted">·</span>
            <span className="text-primary">{currentName}</span>
          </>
        )}
      </div>

      {/* 播放器 */}
      <VideoPlayer
        url={currentUrl}
        animeId={params.id as string}
        episodeId={currentUrl}
      />

      {/* 弹幕发送 */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-muted" />
        <input
          type="text"
          value={danmakuInput}
          onChange={(e) => setDanmakuInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendDanmaku()}
          placeholder="发送弹幕..."
          className="flex-1 h-10 px-4 rounded-lg bg-card border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleSendDanmaku}
          className="px-4 h-10 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm"
        >
          发送
        </button>
      </div>

      {/* 剧集列表 */}
      {sources.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">选集播放</h2>
          <EpisodeList
            sources={sources}
            currentEpisode={currentUrl}
            onEpisodeClick={handleEpisodeClick}
          />
        </section>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PlayContent />
    </Suspense>
  );
}
