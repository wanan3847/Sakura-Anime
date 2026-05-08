"use client";

import { useEffect, useRef, useState } from "react";

export default function TestVideoPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Loading...");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Test with sources that have AAC audio
    const testUrls = [
      { name: "zuidapi (One Piece 1080p)", url: "https://v5.zuidazym3u8.com/yyv5/202310/13/j3YN6tyqjy1/video/index.m3u8" },
      { name: "wujinapi (One Piece 720p)", url: "https://v5.ppqrrs.com/wjv5/202310/13/j3YN6tyqjy1/video/index.m3u8" },
      { name: "bfzyapi (One Piece)", url: "https://c1.rrcdnbf2.com/video/haizeiwang/%E7%AC%AC001%E9%9B%86/index.m3u8" },
    ];

    video.addEventListener("error", () => {
      const err = video.error;
      addLog(`Video error: code=${err?.code} message=${err?.message}`);
    });
    video.addEventListener("playing", () => {
      addLog("PLAYING!");
      setStatus("Playing!");
    });
    video.addEventListener("loadeddata", () => {
      addLog("loadeddata event");
    });
    video.addEventListener("canplay", () => {
      addLog("canplay event");
    });

    const runTest = async (index: number) => {
      if (index >= testUrls.length) {
        addLog("All sources failed");
        setStatus("All sources failed");
        return;
      }

      const test = testUrls[index];
      addLog(`\n--- Test ${index + 1}: ${test.name} ---`);
      setStatus(`Testing: ${test.name}...`);

      try {
        const HlsModule = await import("hls.js");
        const Hls = HlsModule.default;

        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            enableWorker: true,
            defaultAudioCodec: "mp4a.40.2",
            appendErrorMaxRetry: 6,
          });

          let played = false;
          let errorCount = 0;

          hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
            addLog(`MANIFEST_PARSED: ${data.levels.length} level(s)`);
            video.play().then(() => {
              played = true;
              addLog("Play started!");
              setStatus("Playing!");
            }).catch((e) => addLog(`Play error: ${e.message}`));
          });

          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
            addLog(`Audio tracks: ${data.audioTracks.length}`);
            data.audioTracks.forEach((t, i) => {
              addLog(`  Track ${i}: codec=${t.audioCodec} channels=${t.channels} default=${t.default}`);
            });
            // Select AAC track
            const aacTrack = data.audioTracks.find(
              (t) => t.audioCodec && t.audioCodec.indexOf("mp4a") !== -1
            );
            if (aacTrack && aacTrack.id !== hls.audioTrack) {
              addLog(`Selecting AAC track: id=${aacTrack.id}`);
              hls.audioTrack = aacTrack.id;
            }
          });

          hls.on(Hls.Events.ERROR, (_event: unknown, data: {
            fatal: boolean;
            type: string;
            details: string;
            sourceBufferName?: string;
            reason?: string;
          }) => {
            errorCount++;
            addLog(`HLS Error #${errorCount}: type=${data.type} details=${data.details} fatal=${data.fatal} buffer=${data.sourceBufferName} reason=${data.reason}`);

            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                addLog("Recovering from NETWORK_ERROR...");
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                addLog("Recovering from MEDIA_ERROR...");
                hls.recoverMediaError();
              } else {
                addLog(`Unrecoverable error, trying next source`);
                hls.destroy();
                setTimeout(() => runTest(index + 1), 500);
              }
            }
          });

          setTimeout(() => {
            if (!played) {
              addLog("Timeout 10s - trying next");
              hls.destroy();
              runTest(index + 1);
            }
          }, 10000);

          hls.loadSource(test.url);
          hls.attachMedia(video);
          addLog("HLS loading...");
        } else {
          addLog("HLS.js not supported in this browser");
          setStatus("HLS not supported");
        }
      } catch (e) {
        addLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
        runTest(index + 1);
      }
    };

    runTest(0);
  }, []);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Video Codec Test</h1>
      <p className="text-muted">Status: {status}</p>

      <video
        ref={videoRef}
        controls
        className="w-full max-w-4xl aspect-video bg-black rounded"
      />

      <div className="bg-card p-4 rounded-lg">
        <h2 className="text-foreground font-bold mb-2">Debug Log:</h2>
        <div className="space-y-1 font-mono text-xs max-h-96 overflow-y-auto">
          {logs.map((msg, i) => (
            <div key={i} className="text-gray-300">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
