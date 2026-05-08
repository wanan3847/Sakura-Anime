"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import VideoPlayer from "@/components/anime/VideoPlayer";
import Loading from "@/components/common/Loading";

interface Episode {
  name: string;
  url: string;
}

interface PlaySource {
  name: string;
  episodes: Episode[];
}

function PlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [sources, setSources] = useState<PlaySource[]>([]);
  const [currentUrl, setCurrentUrl] = useState(searchParams.get("url") || "");
  const [currentName, setCurrentName] = useState(searchParams.get("name") || "");
  const [animeName, setAnimeName] = useState("");
  const [animeCover, setAnimeCover] = useState("");
  const [danmakuInput, setDanmakuInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentSource, setCurrentSource] = useState("");
  const [activeSourceIdx, setActiveSourceIdx] = useState(0);
  const initializedRef = useRef(false);

  // 源名称中文化
  const SOURCE_NAME_MAP: Record<string, string> = {
    bfzym3u8: "暴风", bfzyplay: "暴风", "1080zyk": "精品", "1080tk": "精品",
    tkm3u8: "西瓜", ffm3u8: "非凡", wjm3u8: "无尽", hnm3u8: "红牛",
    jsm3u8: "计算云", fcm3u8: "凤雏云", xgm3u8: "西瓜", zuidam3u8: "最大",
    liangzi: "量子", lzm3u8: "量子",
  };
  const mapName = (n: string) => SOURCE_NAME_MAP[n.toLowerCase().trim()] || n;

  const parsePlaySources = (from: string, url: string): PlaySource[] => {
    if (!from || !url) return [];
    const fromList = from.split("$$$");
    const urlList = url.split("$$$");
    return fromList.map((name, i) => {
      const urlStr = urlList[i] || "";
      const episodes = urlStr.split("#").filter(Boolean).map((ep) => {
        const parts = ep.split("$");
        return { name: parts[0] || "播放", url: parts[1] || "" };
      });
      return { name: mapName(name), episodes };
    });
  };

  const fetchDetail = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/anime/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnimeName(data.vod_name || "");
        setAnimeCover(data.vod_pic || "");

        const from = data.vod_play_from || "";
        const playUrl = data.vod_play_url || "";

        if (from && playUrl) {
          const parsed = parsePlaySources(from, playUrl);
          setSources(parsed);

          if (!initializedRef.current && parsed.length > 0 && parsed[0].episodes.length > 0) {
            initializedRef.current = true;
            const firstEp = parsed[0].episodes[0];
            if (!currentUrl) {
              setCurrentUrl(firstEp.url);
              setCurrentName(firstEp.name);
            }
            setCurrentSource(parsed[0].name);
          }
        } else {
          setError("该动漫暂无播放源");
        }
      } else {
        setError("加载失败");
      }
    } catch {
      setError("网络请求失败");
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setIsFavorited((Array.isArray(data) ? data : []).some((f: { animeId: string }) => f.animeId === String(params.id)));
      }
    } catch {}
  };

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  useEffect(() => {
    checkFavorite();
  }, [session, params.id]);

  // 记录历史
  useEffect(() => {
    if (!session?.user || !currentUrl || !animeName) return;
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animeId: String(params.id), animeName, animeCover,
        episodeId: currentUrl, episodeName: currentName,
      }),
    }).catch(() => {});
  }, [currentUrl, currentName, animeName, session, params.id]);

  const handleEpisodeClick = useCallback((episode: Episode, sourceIdx?: number) => {
    setCurrentUrl(episode.url);
    setCurrentName(episode.name);
    if (sourceIdx !== undefined) {
      setActiveSourceIdx(sourceIdx);
      setCurrentSource(sources[sourceIdx]?.name || "");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("url", episode.url);
    url.searchParams.set("name", episode.name);
    window.history.replaceState({}, "", url.toString());
  }, [sources]);

  // 源切换
  const handleSourceChange = (idx: number) => {
    setActiveSourceIdx(idx);
    setCurrentSource(sources[idx]?.name || "");
    const firstEp = sources[idx]?.episodes[0];
    if (firstEp) {
      setCurrentUrl(firstEp.url);
      setCurrentName(firstEp.name);
    }
  };

  // 视频播放失败自动切换下一个源
  const handleVideoError = useCallback(() => {
    if (sources.length <= 1) return;
    const nextIdx = (activeSourceIdx + 1) % sources.length;
    const nextSource = sources[nextIdx];
    const currentEpIdx = sources[activeSourceIdx]?.episodes.findIndex((e) => e.url === currentUrl) ?? 0;
    const nextEp = nextSource.episodes[currentEpIdx] || nextSource.episodes[0];
    if (nextEp) {
      setActiveSourceIdx(nextIdx);
      setCurrentSource(nextSource.name);
      setCurrentUrl(nextEp.url);
      setCurrentName(nextEp.name);
    }
  }, [sources, activeSourceIdx, currentUrl]);

  const toggleFavorite = async () => {
    if (!session?.user) { window.location.href = "/user/profile"; return; }
    try {
      if (isFavorited) {
        await fetch(`/api/favorites?animeId=${params.id}`, { method: "DELETE" });
        setIsFavorited(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId: String(params.id), animeName, animeCover }),
        });
        setIsFavorited(true);
      }
    } catch {}
  };

  const handleSendDanmaku = async () => {
    if (!danmakuInput.trim()) return;
    try {
      await fetch("/api/danmaku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: params.id, episodeId: currentUrl, text: danmakuInput, time: 0, color: "#ffffff", type: 0 }),
      });
      // 即时显示弹幕
      const dpEl = document.querySelector(".dplayer") as HTMLElement & { dp?: { danmaku: { draw: (d: unknown) => void } } };
      if (dpEl?.dp?.danmaku) {
        dpEl.dp.danmaku.draw({ text: danmakuInput, color: "#ffffff", type: 0 });
      }
      setDanmakuInput("");
    } catch {}
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/anime/${params.id}`} className="flex items-center gap-2 text-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" /> 返回详情
          </Link>
        </div>
        <div className="text-center py-20 space-y-4">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchDetail} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm">重试</button>
        </div>
      </div>
    );
  }

  const activeSource = sources[activeSourceIdx];

  return (
    <div className="space-y-6">
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href={`/anime/${params.id}`} className="flex items-center gap-2 text-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" /> 返回详情
          </Link>
          {animeName && <><span className="text-muted">·</span><span className="text-foreground font-medium">{animeName}</span></>}
          {currentName && <><span className="text-muted">·</span><span className="text-primary">{currentName}</span></>}
          {currentSource && <><span className="text-muted">·</span><span className="text-sm text-muted">[{currentSource}]</span></>}
        </div>
        <button onClick={toggleFavorite} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-colors shrink-0" title={isFavorited ? "取消收藏" : "收藏"}>
          <Heart className={`w-5 h-5 transition-colors ${isFavorited ? "fill-primary text-primary" : "text-muted"}`} />
          <span className="text-sm text-foreground">{isFavorited ? "已收藏" : "收藏"}</span>
        </button>
      </div>

      {/* 播放器 */}
      {currentUrl ? (
        <VideoPlayer url={currentUrl} animeId={params.id as string} episodeId={currentUrl} onError={handleVideoError} />
      ) : (
        <div className="w-full aspect-video rounded-lg bg-black flex items-center justify-center">
          <p className="text-muted">请选择剧集开始播放</p>
        </div>
      )}

      {/* 弹幕 */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-muted" />
        <input type="text" value={danmakuInput} onChange={(e) => setDanmakuInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendDanmaku()} placeholder="发送弹幕..." className="flex-1 h-10 px-4 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary" />
        <button onClick={handleSendDanmaku} className="px-4 h-10 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm">发送</button>
      </div>

      {/* 播放源 + 剧集 */}
      {sources.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">选集播放</h2>

          {/* 源切换 */}
          {sources.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {sources.map((source, i) => (
                <button
                  key={i}
                  onClick={() => handleSourceChange(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    i === activeSourceIdx ? "bg-primary text-white" : "bg-card hover:bg-card-hover text-muted border border-border"
                  }`}
                >
                  {source.name}
                </button>
              ))}
            </div>
          )}

          {/* 剧集列表 */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {activeSource?.episodes.map((ep, i) => (
              <button
                key={i}
                onClick={() => handleEpisodeClick(ep, activeSourceIdx)}
                className={`px-2 py-1.5 rounded text-sm truncate transition-colors ${
                  ep.url === currentUrl ? "bg-primary text-white" : "bg-card hover:bg-card-hover text-muted hover:text-primary border border-border"
                }`}
                title={ep.name}
              >
                {ep.name}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-8 text-muted">暂无播放源</div>
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
