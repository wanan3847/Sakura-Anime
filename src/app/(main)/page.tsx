"use client";

import { useEffect, useState } from "react";
import AnimeSlider from "@/components/anime/AnimeSlider";
import AnimeGrid from "@/components/anime/AnimeGrid";
import Loading from "@/components/common/Loading";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

interface AnimeItem {
  vod_id: string | number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_content: string;
  type_name: string;
}

interface AnimeListResponse {
  list: AnimeItem[];
  pagecount: number;
}

interface ScheduleItem {
  id: string;
  animeId: string;
  animeName: string;
  animePic: string | null;
  dayOfWeek: number;
  timeSlot: string | null;
}

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function HomePage() {
  const [recommend, setRecommend] = useState<AnimeItem[]>([]);
  const [latest, setLatest] = useState<AnimeItem[]>([]);
  const [schedule, setSchedule] = useState<Record<number, ScheduleItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, latestRes, scheduleRes] = await Promise.all([
          fetch("/api/anime?page=1&limit=12&sort=hits&type=日本动漫"),
          fetch("/api/anime?page=1&limit=24&sort=time&type=日本动漫"),
          fetch("/api/schedule"),
        ]);

        let recList: AnimeItem[] = [];
        let latestList: AnimeItem[] = [];

        if (recRes.ok) {
          const data: AnimeListResponse = await recRes.json();
          recList = data.list || [];
        }
        if (latestRes.ok) {
          const data: AnimeListResponse = await latestRes.json();
          latestList = data.list || [];
        }

        // 批量获取详情拿图片（list接口不返回vod_pic）
        const allItems = [...recList, ...latestList];
        const uniqueIds = [...new Set(allItems.map((i) => i.vod_id))];
        const detailMap = new Map<string, AnimeItem>();

        await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await fetch(`/api/anime/${id}`);
              if (res.ok) {
                const detail = await res.json();
                detailMap.set(String(id), detail);
              }
            } catch {}
          })
        );

        const enrichItem = (item: AnimeItem): AnimeItem => {
          const detail = detailMap.get(String(item.vod_id));
          if (detail) {
            return {
              ...item,
              vod_pic: detail.vod_pic || item.vod_pic,
              vod_content: detail.vod_content || item.vod_content,
            };
          }
          return item;
        };

        setRecommend(recList.map(enrichItem));
        setLatest((latestList.length > 0 ? latestList : recList).map(enrichItem));

        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          setSchedule(scheduleData);
        }
      } catch {
        setRecommend(getSampleAnimes());
        setLatest(getSampleAnimes().slice(0, 12));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;

  const today = new Date().getDay();
  const hasSchedule = Object.keys(schedule).length > 0;

  return (
    <div className="space-y-8">
      {/* 轮播 + 今日番剧 双栏 */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <AnimeSlider animes={recommend.length > 0 ? recommend : getSampleAnimes()} />
        </div>

        {/* 今日番剧侧栏 */}
        {hasSchedule && (
          <div className="w-full lg:w-80 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">今日番剧</h2>
                <span className="text-xs text-muted">({DAY_NAMES[today]})</span>
              </div>
              <Link href="/schedule" className="text-xs text-primary hover:text-primary-hover transition-colors flex items-center gap-0.5">
                完整周表 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(schedule[today] || []).map((item) => (
                <Link
                  key={item.id}
                  href={`/anime/${item.animeId}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-card-hover transition-colors group"
                >
                  {item.animePic ? (
                    <img src={item.animePic} alt={item.animeName} className="w-10 h-14 object-cover rounded shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-10 h-14 rounded shrink-0 bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 text-xs font-bold">{item.animeName.slice(0, 2)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{item.animeName}</h3>
                    {item.timeSlot && <span className="text-xs text-muted">{item.timeSlot}</span>}
                  </div>
                </Link>
              ))}
              {(schedule[today] || []).length === 0 && (
                <p className="text-sm text-muted text-center py-4">今日暂无排期</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 宽屏完整周番表 */}
      {hasSchedule && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">周番表</h2>
            </div>
            <Link href="/schedule" className="text-sm text-primary hover:text-primary-hover transition-colors">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {DAY_NAMES.map((dayName, dayIdx) => {
              const items = schedule[dayIdx] || [];
              const isToday = dayIdx === today;
              return (
                <div
                  key={dayIdx}
                  className={`rounded-xl border transition-all ${
                    isToday
                      ? "border-l-4 border-l-primary border-t border-r border-b border-t-primary/20 border-r-primary/20 border-b-primary/20 bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="px-3 py-2 border-b border-border">
                    <span className={`text-sm ${isToday ? "font-extrabold text-primary" : "font-semibold text-foreground"}`}>
                      {dayName}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2 min-h-[100px] max-h-[300px] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-muted text-xs text-center py-3">暂无排期</p>
                    ) : (
                      items.map((item) => (
                        <Link
                          key={item.id}
                          href={`/anime/${item.animeId}`}
                          className="block group"
                        >
                          <div className="flex items-start gap-2">
                            {item.animePic ? (
                              <img src={item.animePic} alt="" className="w-8 h-11 object-cover rounded shrink-0" loading="lazy" />
                            ) : (
                              <div className="w-8 h-11 rounded shrink-0 bg-accent/50" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                {item.animeName}
                              </h3>
                              {item.timeSlot && (
                                <p className="text-[11px] text-muted mt-0.5">{item.timeSlot}</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 热门推荐 */}
      <AnimeGrid
        animes={recommend.length > 0 ? recommend : getSampleAnimes()}
        title="热门推荐"
      />

      {/* 最近更新 */}
      <AnimeGrid
        animes={latest.length > 0 ? latest : getSampleAnimes().slice(0, 12)}
        title="最近更新"
      />
    </div>
  );
}

// 示例数据 - API不可用时使用
function getSampleAnimes(): AnimeItem[] {
  return [
    { vod_id: "1", vod_name: "进击的巨人 最终季", vod_pic: "", vod_remarks: "全集", vod_year: "2024", vod_content: "人类与巨人的终极之战", type_name: "日本动漫" },
    { vod_id: "2", vod_name: "鬼灭之刃 柱训练篇", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_content: "炭治郎的修炼之旅", type_name: "日本动漫" },
    { vod_id: "3", vod_name: "咒术回战 第二季", vod_pic: "", vod_remarks: "全集", vod_year: "2023", vod_content: "虎杖悠仁的咒术之路", type_name: "日本动漫" },
    { vod_id: "4", vod_name: "斗破苍穹 年番", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_content: "萧炎的修炼之路", type_name: "国产动漫" },
    { vod_id: "5", vod_name: "完美世界", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_content: "荒的传说", type_name: "国产动漫" },
    { vod_id: "6", vod_name: "间谍过家家 第三季", vod_pic: "", vod_remarks: "全集", vod_year: "2024", vod_content: "假家庭的秘密生活", type_name: "日本动漫" },
    { vod_id: "7", vod_name: "排球少年!! 垃圾场的决战", vod_pic: "", vod_remarks: "剧场版", vod_year: "2024", vod_content: "排球少年的最终之战", type_name: "动漫电影" },
    { vod_id: "8", vod_name: "葬送的芙莉莲", vod_pic: "", vod_remarks: "全集", vod_year: "2023", vod_content: "精灵魔法使的旅途", type_name: "日本动漫" },
    { vod_id: "9", vod_name: "仙逆", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_content: "王林的修仙之路", type_name: "国产动漫" },
    { vod_id: "10", vod_name: "凡人修仙传", vod_pic: "", vod_remarks: "更新中", vod_year: "2024", vod_content: "韩立的修仙传奇", type_name: "国产动漫" },
    { vod_id: "11", vod_name: "我独自升级", vod_pic: "", vod_remarks: "全集", vod_year: "2024", vod_content: "最弱猎人的逆袭", type_name: "日本动漫" },
    { vod_id: "12", vod_name: "药屋少女的呢喃", vod_pic: "", vod_remarks: "全集", vod_year: "2023", vod_content: "药师少女的宫廷推理", type_name: "日本动漫" },
  ];
}
