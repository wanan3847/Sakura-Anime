"use client";

import { useState } from "react";

interface Episode {
  name: string;
  url: string;
}

interface PlaySource {
  name: string;
  episodes: Episode[];
}

interface EpisodeListProps {
  sources: PlaySource[];
  currentEpisode?: string;
  onEpisodeClick: (episode: Episode, sourceName: string) => void;
}

export default function EpisodeList({ sources, currentEpisode, onEpisodeClick }: EpisodeListProps) {
  const [activeSource, setActiveSource] = useState(0);

  if (sources.length === 0) return null;

  return (
    <div>
      {/* 线路切换 */}
      {sources.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {sources.map((source, i) => (
            <button
              key={i}
              onClick={() => setActiveSource(i)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                i === activeSource
                  ? "bg-primary text-white"
                  : "bg-card hover:bg-card-hover text-muted"
              }`}
            >
              {source.name}
            </button>
          ))}
        </div>
      )}

      {/* 剧集列表 */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {sources[activeSource]?.episodes.map((ep, i) => (
          <button
            key={i}
            onClick={() => onEpisodeClick(ep, sources[activeSource].name)}
            className={`px-2 py-1.5 rounded text-sm truncate transition-colors ${
              ep.url === currentEpisode
                ? "bg-primary text-white"
                : "bg-card hover:bg-card-hover text-muted hover:text-primary"
            }`}
            title={ep.name}
          >
            {ep.name}
          </button>
        ))}
      </div>
    </div>
  );
}
