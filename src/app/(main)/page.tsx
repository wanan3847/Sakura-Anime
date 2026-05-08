"use client";

import { useEffect, useState } from "react";
import AnimeSlider from "@/components/anime/AnimeSlider";
import AnimeGrid from "@/components/anime/AnimeGrid";
import Loading from "@/components/common/Loading";
import Link from "next/link";
import { Calendar } from "lucide-react";

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

  return (
    <div className="space-y-10">
      {/* 轮播推荐 */}
      <AnimeSlider animes={recommend.length > 0 ? recommend : getSampleAnimes()} />

      {/* 周番表 */}
      {Object.keys(schedule).length > 0 && (
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAY_NAMES.map((dayName, dayIdx) => {
              const items = schedule[dayIdx] || [];
              const today = new Date().getDay();
              const isToday = dayIdx === today;

              return (
                <div
                  key={dayIdx}
                  className={`rounded-lg border p-2 min-h-[80px] transition-all ${
                    isToday
                      ? "border-l-4 border-l-primary border-t-primary/20 border-r-primary/20 border-b-primary/20 bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="text-center mb-2">
                    <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                      {dayName}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href={`/anime/${item.animeId}`}
                        className="block text-[10px] text-foreground hover:text-primary truncate transition-colors"
                        title={item.animeName}
                      >
                        {item.animeName}
                      </Link>
                    ))}
                    {items.length > 3 && (
                      <span className="text-[9px] text-muted">+{items.length - 3}</span>
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
