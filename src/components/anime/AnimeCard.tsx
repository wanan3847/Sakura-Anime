"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getAnimeCover } from "@/lib/utils";

interface AnimeCardProps {
  id: string;
  title: string;
  cover?: string;
  remarks?: string;
  year?: string;
  type?: string;
}

export default function AnimeCard({ id, title, cover, remarks, year, type }: AnimeCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = !imgError && cover && (cover.startsWith("http://") || cover.startsWith("https://"));

  return (
    <Link href={`/anime/${id}`} className="group block">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card">
        {hasImage ? (
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-300 via-pink-200 to-rose-200 flex items-center justify-center p-4">
            <span className="text-pink-700 text-2xl font-bold text-center line-clamp-3">{title}</span>
          </div>
        )}
        {/* 悬浮遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* 标签 */}
        {remarks && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-white text-xs rounded">
            {remarks}
          </span>
        )}
        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">
            {title}
          </h3>
          {(year || type) && (
            <p className="text-gray-300 text-xs mt-1">
              {[year, type].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
