"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AnimeGrid from "@/components/anime/AnimeGrid";
import Pagination from "@/components/common/Pagination";
import Loading from "@/components/common/Loading";
import { getTypeOptions } from "@/lib/api";

interface AnimeItem {
  vod_id: string | number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_content: string;
  type_name: string;
}

const typeOptions = ["全部", ...getTypeOptions().map((t) => t.label)];
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
  const [error, setError] = useState("");

  const type = searchParams.get("type") || "";
  const year = searchParams.get("year") || "";
  const sort = searchParams.get("sort") || "time";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "24", sort });
      if (type && type !== "全部") params.set("type", type);
      if (year && year !== "全部") params.set("year", year);

      const res = await fetch(`/api/anime?${params}`);
      if (!res.ok) {
        setError("加载失败，请稍后重试");
        return;
      }

      const data = await res.json();
      const list: AnimeItem[] = data.list || [];
      setTotalPages(data.pagecount || 1);

      if (list.length === 0) {
        setAnimes([]);
        return;
      }

      // 批量获取详情拿封面图（ac=list 不返回 vod_pic）
      const uniqueIds = [...new Set(list.map((i) => i.vod_id))];
      const detailMap = new Map<string, AnimeItem>();

      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const detailRes = await fetch(`/api/anime/${id}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              detailMap.set(String(id), detail);
            }
          } catch {}
        })
      );

      const enriched = list.map((item) => {
        const detail = detailMap.get(String(item.vod_id));
        return detail
          ? { ...item, vod_pic: detail.vod_pic || item.vod_pic, vod_content: detail.vod_content || item.vod_content }
          : item;
      });

      setAnimes(enriched);
    } catch {
      setError("网络请求失败");
    } finally {
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
      <h1 className="text-2xl font-bold text-foreground">分类浏览</h1>

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
                  : "bg-accent/50 text-muted hover:text-primary"
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
                  : "bg-accent/50 text-muted hover:text-primary"
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
                  : "bg-accent/50 text-muted hover:text-primary"
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
      ) : error ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-red-400">{error}</p>
          <button onClick={() => fetchData()} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm">重试</button>
        </div>
      ) : animes.length === 0 ? (
        <div className="text-center py-20 text-muted">暂无结果</div>
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
