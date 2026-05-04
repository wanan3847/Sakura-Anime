"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AnimeGrid from "@/components/anime/AnimeGrid";
import Pagination from "@/components/common/Pagination";
import Loading from "@/components/common/Loading";

interface AnimeItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  type_name: string;
}

const typeOptions = ["全部", "日本动漫", "国产动漫", "动漫电影", "欧美动漫"];
const yearOptions = ["全部", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];
const sortOptions = [
  { label: "最新更新", value: "time" },
  { label: "最多播放", value: "hits" },
  { label: "最高评分", value: "score" },
];

function CategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const type = searchParams.get("type") || "";
  const year = searchParams.get("year") || "";
  const sort = searchParams.get("sort") || "time";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "24", sort });
      if (type && type !== "全部") params.set("type", type);
      if (year && year !== "全部") params.set("year", year);

      const res = await fetch(`/api/anime?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAnimes(data.list || []);
        setTotalPages(data.pagecount || 1);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [type, year, sort, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "全部" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`/category?${params}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">分类浏览</h1>

      {/* 筛选条件 */}
      <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted text-sm w-12">类型:</span>
          {typeOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => updateParam("type", opt)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                (type || "全部") === opt
                  ? "bg-primary text-white"
                  : "bg-accent/50 text-muted hover:text-white"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted text-sm w-12">年份:</span>
          {yearOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => updateParam("year", opt)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                (year || "全部") === opt
                  ? "bg-primary text-white"
                  : "bg-accent/50 text-muted hover:text-white"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted text-sm w-12">排序:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("sort", opt.value)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sort === opt.value
                  ? "bg-primary text-white"
                  : "bg-accent/50 text-muted hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 结果 */}
      {loading ? (
        <Loading />
      ) : (
        <>
          <AnimeGrid animes={animes} />
          <Pagination current={page} total={totalPages} onChange={(p) => updateParam("page", p.toString())} />
        </>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CategoryContent />
    </Suspense>
  );
}
