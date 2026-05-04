"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  url: string;
  animeId: string;
  episodeId: string;
  onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({ url, animeId, episodeId, onTimeUpdate }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    let dp: unknown = null;

    const initPlayer = async () => {
      const DPlayer = (await import("dplayer")).default;

      const isHls = url.includes(".m3u8");
      const container = containerRef.current;
      if (!container) return;

      dp = new DPlayer({
        container,
        autoplay: true,
        theme: "#e94560",
        loop: false,
        screenshot: true,
        hotkey: true,
        preload: "auto",
        volume: 0.7,
        mutex: true,
        video: {
          url,
          type: isHls ? "customHls" : "auto",
          customType: {
            customHls: async (video: HTMLVideoElement) => {
              const Hls = (await import("hls.js")).default;
              if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(video.src);
                hls.attachMedia(video);
              }
            },
          },
        },
        danmaku: {
          id: `${animeId}_${episodeId}`,
          api: "/api/danmaku",
          addition: [],
        },
        api: {
          id: `${animeId}_${episodeId}`,
          url: "/api/danmaku",
        },
      });

      playerRef.current = dp;

      // 监听时间更新
      if (onTimeUpdate) {
        (dp as { video: HTMLVideoElement }).video.addEventListener("timeupdate", () => {
          onTimeUpdate((dp as { video: HTMLVideoElement }).video.currentTime);
        });
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current && typeof (playerRef.current as { destroy?: () => void }).destroy === "function") {
        (playerRef.current as { destroy: () => void }).destroy();
      }
    };
  }, [url, animeId, episodeId, onTimeUpdate]);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video rounded-lg overflow-hidden bg-black"
    />
  );
}
