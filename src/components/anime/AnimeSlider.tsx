"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAnimeCover } from "@/lib/utils";

interface SlideAnime {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_content: string;
  vod_remarks: string;
}

interface AnimeSliderProps {
  animes: SlideAnime[];
}

export default function AnimeSlider({ animes }: AnimeSliderProps) {
  const [current, setCurrent] = useState(0);
  const slides = animes.slice(0, 5);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (slides.length === 0) return null;

  const anime = slides[current];

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden bg-card">
      {/* 背景图 */}
      <Image
        src={anime.vod_pic || getAnimeCover(anime.vod_name)}
        alt={anime.vod_name}
        fill
        className="object-cover blur-sm scale-105"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

      {/* 内容 */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full flex items-center gap-8">
          <div className="hidden md:block relative w-40 h-52 rounded-lg overflow-hidden shrink-0 shadow-2xl">
            <Image
              src={anime.vod_pic || getAnimeCover(anime.vod_name)}
              alt={anime.vod_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 line-clamp-1">
              {anime.vod_name}
            </h2>
            <p className="text-gray-300 text-sm line-clamp-3 mb-4">
              {anime.vod_content?.replace(/<[^>]+>/g, "") || "暂无简介"}
            </p>
            <div className="flex items-center gap-3">
              {anime.vod_remarks && (
                <span className="px-3 py-1 bg-primary text-white text-sm rounded">
                  {anime.vod_remarks}
                </span>
              )}
              <Link
                href={`/anime/${anime.vod_id}`}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors backdrop-blur"
              >
                立即观看
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 左右箭头 */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 指示器 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === current ? "bg-primary" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
