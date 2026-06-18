// 主页：轮播（站长推荐）+ 最新更新 + 本周更新（周番表）
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Loading from "@/components/common/Loading";
import { ChevronLeft, ChevronRight, Play, Star, Clock, Calendar, TrendingUp } from "lucide-react";

interface CatalogItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_score: string;
  type_name: string;
  vod_area: string;
  description?: string;
}

interface CarouselItem {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  badge: string | null;
}

interface ScheduleItem {
  id: string;
  animeId: string;
  animeName: string;
  animePic: string | null;
  dayOfWeek: number;
  timeSlot: string | null;
  remark: string | null;
}

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function HomePage() {
  const [carousels, setCarousels] = useState<CarouselItem[]>([]);
  const [hotAnime, setHotAnime] = useState<CatalogItem[]>([]);
  const [schedule, setSchedule] = useState<Record<number, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const today = new Date().getDay();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carouselRes, hotRes, scheduleRes] = await Promise.allSettled([
          fetch("/api/carousel").then((r) => r.ok ? r.json() : []),
          fetch("/api/catalog?limit=24&sort=year").then((r) => r.ok ? r.json() : { list: [] }),
          fetch("/api/schedule").then((r) => r.ok ? r.json() : {}),
        ]);

        if (carouselRes.status === "fulfilled") setCarousels(carouselRes.value);
        if (hotRes.status === "fulfilled") setHotAnime(hotRes.value.list || []);
        if (scheduleRes.status === "fulfilled") setSchedule(scheduleRes.value);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (carousels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carousels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carousels.length]);

  if (loading) return <Loading />;

  const displayHot = hotAnime.length > 0 ? hotAnime : getSampleAnimes();

  // 轮播数据：管理员轮播 or 热门推荐前5
  const slides: CarouselItem[] = carousels.length > 0
    ? carousels
    : displayHot.slice(0, 5).map(a => ({
        id: String(a.vod_id),
        title: a.vod_name,
        subtitle: `${a.vod_year} · ${a.vod_area || ""} · ${a.vod_remarks || ""}`,
        imageUrl: a.vod_pic || null,
        linkUrl: `/anime/${a.vod_id}`,
        badge: a.vod_score && parseFloat(a.vod_score) > 0 ? `${a.vod_score}分` : null,
      }));

  // 今天的周番
  const todaySchedule = schedule[today] || [];

  return (
    <div className="space-y-8">
      {/* ============ 大轮播图 ============ */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] xl:aspect-[25/9]">
        {slides.map((slide, idx) => (
          <Link key={slide.id} href={slide.linkUrl || "#"}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
            {slide.imageUrl ? (
              <>
                {/* Blurred background layer — fills entire container */}
                <img src={slide.imageUrl} alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-60" />
                {/* Main foreground image — fills container, blurred bg handles gaps */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={slide.imageUrl} alt={slide.title}
                    className="w-full h-full object-cover object-center scale-105" />
                </div>
                {/* Gradient overlays for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-10 max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] z-20">
              {slide.badge && (
                <span className="inline-block px-2 py-0.5 bg-primary text-white text-xs rounded-full mb-3 shadow-lg">{slide.badge}</span>
              )}
              <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">{slide.title}</h2>
              {slide.subtitle && (
                <p className="text-white/70 text-xs sm:text-sm lg:text-base line-clamp-2 mb-2 sm:mb-4 drop-shadow-md">{slide.subtitle}</p>
              )}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-lg">
                <Play className="w-4 h-4" /> 立即观看
              </span>
            </div>
          </Link>
        ))}
        {slides.length > 1 && (
          <>
            <button onClick={(e) => { e.preventDefault(); setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length); }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur transition-colors">
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={(e) => { e.preventDefault(); setCurrentSlide((prev) => (prev + 1) % slides.length); }}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur transition-colors">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
              {slides.map((_, idx) => (
                <button key={idx} onClick={(e) => { e.preventDefault(); setCurrentSlide(idx); }}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? "bg-white w-4 sm:w-8" : "bg-white/40 w-1.5 sm:w-3 hover:bg-white/60"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ============ 周番表 - 今日更新 ============ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            今日更新 · {DAY_NAMES[today]}
          </h2>
          <Link href="/schedule" className="text-xs text-primary hover:text-primary-hover transition-colors">完整周番表 →</Link>
        </div>
        {todaySchedule.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {todaySchedule.map((item) => (
              <Link key={item.id} href={`/anime/${item.animeId}`} className="group block">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card">
                  {item.animePic ? (
                    <img src={item.animePic} alt={item.animeName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 text-sm font-bold">{item.animeName.slice(0, 2)}</span>
                    </div>
                  )}
                  {item.timeSlot && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {item.timeSlot}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="text-white text-xs font-medium line-clamp-2 drop-shadow-lg">{item.animeName}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-muted opacity-30" />
            <p className="text-muted text-sm">今天暂无排期</p>
            <Link href="/schedule" className="text-primary text-xs hover:underline mt-1 inline-block">去周番表查看全部 →</Link>
          </div>
        )}
      </section>

      {/* ============ 最新番剧 ============ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            最新番剧
          </h2>
          <Link href="/category" className="text-xs text-primary hover:text-primary-hover transition-colors">查看更多 →</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {displayHot.slice(0, 16).map((anime) => (
            <Link key={anime.vod_id} href={`/anime/${anime.vod_id}`} className="group block">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card">
                {anime.vod_pic && (anime.vod_pic.startsWith("http://") || anime.vod_pic.startsWith("https://")) ? (
                  <Image src={anime.vod_pic} alt={anime.vod_name} fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
                    unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-300 to-rose-200 flex items-center justify-center p-2">
                    <span className="text-pink-700 text-xs font-bold text-center line-clamp-3">{anime.vod_name}</span>
                  </div>
                )}
                {anime.vod_remarks && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">{anime.vod_remarks}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h3 className="text-white text-xs font-medium line-clamp-2 drop-shadow-lg">{anime.vod_name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function getSampleAnimes(): CatalogItem[] {
  return [
    { vod_id: "1", vod_name: "进击的巨人 最终季", vod_pic: "", vod_remarks: "全集", vod_year: "2024", vod_score: "9.5", type_name: "日韩动漫", vod_area: "日本" },
    { vod_id: "2", vod_name: "鬼灭之刃", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_score: "9.3", type_name: "日韩动漫", vod_area: "日本" },
    { vod_id: "3", vod_name: "咒术回战", vod_pic: "", vod_remarks: "全集", vod_year: "2023", vod_score: "9.1", type_name: "日韩动漫", vod_area: "日本" },
    { vod_id: "4", vod_name: "斗破苍穹", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_score: "8.8", type_name: "国产动漫", vod_area: "中国" },
    { vod_id: "5", vod_name: "完美世界", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_score: "8.5", type_name: "国产动漫", vod_area: "中国" },
    { vod_id: "6", vod_name: "间谍过家家", vod_pic: "", vod_remarks: "全集", vod_year: "2024", vod_score: "9.2", type_name: "日韩动漫", vod_area: "日本" },
    { vod_id: "7", vod_name: "排球少年", vod_pic: "", vod_remarks: "剧场版", vod_year: "2024", vod_score: "9.4", type_name: "动漫电影", vod_area: "日本" },
    { vod_id: "8", vod_name: "葬送的芙莉莲", vod_pic: "", vod_remarks: "全集", vod_year: "2023", vod_score: "9.6", type_name: "日韩动漫", vod_area: "日本" },
  ];
}
