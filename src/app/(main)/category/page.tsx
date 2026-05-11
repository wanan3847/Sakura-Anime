"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Pagination from "@/components/common/Pagination";
import Loading from "@/components/common/Loading";
import { getAnimeCover } from "@/lib/utils";
import { Star } from "lucide-react";

interface AnimeItem {
  vod_id: string | number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_area: string;
  vod_class: string;
  vod_score?: string;
  type_name: string;
}

const typeOptions = [
  { label: "全部", value: "" },
  { label: "日本动漫", value: "日本动漫" },
  { label: "国产动漫", value: "国产动漫" },
  { label: "动漫电影", value: "动漫电影" },
  { label: "欧美动漫", value: "欧美动漫" },
];

const yearOptions = ["全部", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];

const statusOptions = [
  { label: "全部", value: "" },
  { label: "连载中", value: "连载" },
  { label: "已完结", value: "完结" },
];

const sortOptions = [
  { label: "最新更新", value: "time" },
  { label: "最多播放", value: "hits" },
  { label: "最高评分", value: "score" },
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const type = searchParams.get("type") || "";
  const year = searchParams.get("year") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "time";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "48",
        sort,
        detail: "1",
      });
      if (type) params.set("type", type);

      const res = await fetch(`/api/anime?${params}`);
      if (!res.ok) {
        setError("加载失败，请稍后重试");
        return;
      }

      const data = await res.json();
      let list: AnimeItem[] = data.list || [];
      setTotal(data.total || 0);

      // 客户端筛选年份和状态
      if (year) {
        list = list.filter((item) => item.vod_year === year);
      }
      if (status) {
        list = list.filter((item) => {
          const r = item.vod_remarks || "";
          if (status === "连载") return r.includes("更新") || r.includes("连载");
          if (status === "完结") return r.includes("全集") || r.includes("完结") || r.includes("已完结");
          return true;
        });
      }

      setAnimes(list);
      setTotalPages(data.pagecount || 1);
    } catch {
      setError("网络请求失败");
    } finally {
      setLoading(false);
    }
  }, [type, year, status, sort, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "全部") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`/category?${params}`);
  };

  const FilterRow = ({ label, options, current, paramKey }: {
    label: string;
    options: { label: string; value: string }[];
    current: string;
    paramKey: string;
  }) => (
    <div className="flex items-start gap-3">
      <span className="text-muted text-sm w-12 shrink-0 pt-1">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam(paramKey, opt.value)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              (current || "") === opt.value
                ? "bg-primary text-white"
                : "bg-accent/50 text-muted hover:text-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">动漫目录</h1>
        {!loading && <span className="text-sm text-muted">共 {total} 部</span>}
      </div>

      {/* 筛选条件 */}
      <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
        <FilterRow label="类型" options={typeOptions} current={type} paramKey="type" />
        <FilterRow label="年份" options={yearOptions.map((y) => ({ label: y, value: y === "全部" ? "" : y }))} current={year} paramKey="year" />
        <FilterRow label="状态" options={statusOptions} current={status} paramKey="status" />
        <FilterRow label="排序" options={sortOptions} current={sort} paramKey="sort" />
      </div>

      {/* 结果 */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-red-400">{error}</p>
          <button onClick={() => fetchData()} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm">重试</button>
        </div>
      ) : animes.length === 0 ? (
        <div className="text-center py-20 text-muted">暂无结果</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {animes.map((anime) => {
              const hasImage = anime.vod_pic && (anime.vod_pic.startsWith("http://") || anime.vod_pic.startsWith("https://"));
              return (
                <Link key={String(anime.vod_id)} href={`/anime/${anime.vod_id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card">
                    {hasImage ? (
                      <Image
                        src={anime.vod_pic}
                        alt={anime.vod_name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-300 via-pink-200 to-rose-200 flex items-center justify-center p-4">
                        <span className="text-pink-700 text-xl font-bold text-center line-clamp-3">{anime.vod_name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {anime.vod_remarks && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-white text-xs rounded">
                        {anime.vod_remarks}
                      </span>
                    )}
                    {anime.vod_score && parseFloat(anime.vod_score) > 0 && (
                      <span className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/90 text-white text-xs rounded">
                        <Star className="w-3 h-3" />
                        {anime.vod_score}
                      </span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">
                        {anime.vod_name}
                      </h3>
                      <p className="text-gray-300 text-xs mt-1">
                        {[anime.vod_year, anime.type_name].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Pagination current={page} total={totalPages} onChange={(p) => updateParam("page", p.toString())} />
        </>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CatalogContent />
    </Suspense>
  );
}
