"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  url: string;
  animeId: string;
  episodeId: string;
  onTimeUpdate?: (time: number) => void;
  onError?: () => void;
}

// 自定义弹幕后端，覆盖 DPlayer 默认的 v3/ 路径
const danmakuBackend = {
  read: (opt: { url: string; success: (data: unknown) => void; error: (msg?: string) => void }) => {
    fetch(opt.url)
      .then((res) => res.json())
      .then((data) => {
        const items = (data.data || []).map((d: unknown[]) => ({
          time: d[0], type: d[1], color: d[2], author: d[3], text: d[4],
        }));
        opt.success(items);
      })
      .catch(() => opt.error());
  },
  send: (opt: { url: string; data: Record<string, unknown>; success: () => void; error: (msg?: string) => void }) => {
    fetch(opt.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opt.data),
    })
      .then((res) => res.json())
      .then(() => opt.success())
      .catch(() => opt.error());
  },
};

export default function VideoPlayer({ url, animeId, episodeId, onTimeUpdate, onError }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dpRef = useRef<unknown>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    let cancelled = false;
    let mediaErrorRetries = 0;

    const createHlsInstance = (
      Hls: typeof import("hls.js").default,
      video: HTMLVideoElement,
      src: string,
    ) => {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
        defaultAudioCodec: "mp4a.40.2",
        appendErrorMaxRetry: 6,
      });
      hlsRef.current = hls as unknown as { destroy: () => void };

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        const tracks = data.audioTracks;
        if (tracks.length > 1) {
          const aacTrack = tracks.find(
            (t) => t.audioCodec && t.audioCodec.indexOf("mp4a") !== -1,
          );
          if (aacTrack && aacTrack.id !== hls.audioTrack) {
            hls.audioTrack = aacTrack.id;
          }
        }
      });

      let networkErrorRetries = 0;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          networkErrorRetries++;
          if (networkErrorRetries <= 2) {
            hls.startLoad();
          } else {
            hls.destroy();
            hlsRef.current = null;
            if (onError) onError();
          }
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          mediaErrorRetries++;
          if (mediaErrorRetries <= 3) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
            hlsRef.current = null;
            if (onError) onError();
          }
          return;
        }

        hls.destroy();
        hlsRef.current = null;
        if (onError) onError();
      });

      return hls;
    };

    (async () => {
      const HlsModule = await import("hls.js");
      if (cancelled) return;
      const Hls = HlsModule.default;

      const DPlayerModule = await import("dplayer");
      if (cancelled) return;
      const DPlayer = DPlayerModule.default;

      const container = containerRef.current;
      if (!container || cancelled) return;

      const isHls = url.includes(".m3u8");
      const proxyUrl = isHls ? `/api/proxy?url=${encodeURIComponent(url)}` : url;

      const dp = new DPlayer({
        container,
        autoplay: false,
        theme: "#ff69b4",
        screenshot: true,
        hotkey: true,
        danmaku: {
          id: `${animeId}_${episodeId}`,
          api: "/api/danmaku",
        },
        video: {
          url: proxyUrl,
          type: isHls ? "customHls" : "auto",
          customType: {
            customHls: (video: HTMLVideoElement) => {
              if (cancelled) return;

              if (Hls.isSupported()) {
                const blankBlob = new Blob([new Uint8Array(0)], { type: "video/mp4" });
                video.src = URL.createObjectURL(blankBlob);
                video.load();

                createHlsInstance(Hls, video, proxyUrl);
              } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = proxyUrl;
              }
            },
          },
        },
      } as unknown as ConstructorParameters<typeof DPlayer>[0]);

      dpRef.current = dp;

      if (onTimeUpdate) {
        dp.video.addEventListener("timeupdate", () => {
          onTimeUpdate(dp.video.currentTime);
        });
      }
    })();

    return () => {
      cancelled = true;
      const hls = hlsRef.current;
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
        hlsRef.current = null;
      }
      const dp = dpRef.current as { destroy?: () => void } | null;
      if (dp && typeof dp.destroy === "function") {
        dp.destroy();
        dpRef.current = null;
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
