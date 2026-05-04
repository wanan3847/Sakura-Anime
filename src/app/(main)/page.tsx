"use client";

import { useEffect, useState } from "react";
import AnimeSlider from "@/components/anime/AnimeSlider";
import AnimeGrid from "@/components/anime/AnimeGrid";
import Loading from "@/components/common/Loading";
import Link from "next/link";

interface AnimeItem {
  vod_id: string;
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

const categories = [
  { label: "日本动漫", type: "日本动漫" },
  { label: "国产动漫", type: "国产动漫" },
  { label: "动漫电影", type: "动漫电影" },
  { label: "欧美动漫", type: "欧美动漫" },
];

export default function HomePage() {
  const [recommend, setRecommend] = useState<AnimeItem[]>([]);
  const [latest, setLatest] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, latestRes] = await Promise.all([
          fetch("/api/anime?page=1&limit=12&sort=hits"),
          fetch("/api/anime?page=1&limit=24&sort=time"),
        ]);

        if (recRes.ok) {
          const data: AnimeListResponse = await recRes.json();
          setRecommend(data.list || []);
        }
        if (latestRes.ok) {
          const data: AnimeListResponse = await latestRes.json();
          setLatest(data.list || []);
        }
      } catch {
        // 使用示例数据
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

      {/* 分类入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.type}
            href={`/category?type=${encodeURIComponent(cat.type)}`}
            className="p-4 rounded-xl bg-card hover:bg-card-hover border border-border transition-colors text-center"
          >
            <span className="text-white font-medium">{cat.label}</span>
          </Link>
        ))}
      </div>

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
