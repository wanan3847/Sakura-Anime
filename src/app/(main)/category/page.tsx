"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Pagination from "@/components/common/Pagination";
import Loading from "@/components/common/Loading";
import { Filter, RotateCcw, Star, Play, Search } from "lucide-react";

interface CatalogItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_score: string;
  vod_area: string;
  type_name: string;
}

const currentYear = new Date().getFullYear();

// 2000年 → 当前年份（最新的排前面）
const yearOptions = Array.from({ length: currentYear - 1999 }, (_, i) => (currentYear - i).toString());

// 季度
const quarterOptions = [
  { label: "全部季度", value: "" },
  { label: "1月番 (冬季)", value: "1" },
  { label: "4月番 (春季)", value: "2" },
  { label: "7月番 (夏季)", value: "3" },
  { label: "10月番 (秋季)", value: "4" },
];

const sortOptions = [
  { label: "最新更新", value: "updatedAt" },
  { label: "最高评分", value: "score" },
  { label: "最新年份", value: "year" },
];

const ITEMS_PER_PAGE = 48;

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [animes, setAnimes] = useState<CatalogItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

  const year = searchParams.get("year") || "";
  const quarter = searchParams.get("quarter") || "";
  const sort = searchParams.get("sort") || "updatedAt";
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");

  // Sync search input with URL param
  useEffect(() => { setSearchInput(q); }, [q]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: String(ITEMS_PER_PAGE),
        sort,
      });
      if (year) params.set("year", year);
      if (quarter) params.set("quarter", quarter);
      if (q) params.set("q", q);

      const res = await fetch(`/api/catalog?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setAnimes(data.list || []);
      setTotal(data.total || 0);
      setTotalPages(data.pagecount || 1);
    } catch {} finally { setLoading(false); }
  }, [year, quarter, sort, q, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    // 切换筛选条件时重置到第一页，改页码时不动
    if (key !== "page") params.delete("page");
    router.push(`/category?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", searchInput.trim());
  };

  const hasFilters = year || quarter || q || sort !== "updatedAt";

  return (
    <div className="space-y-5">
      {/* Header + Search */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">动漫目录</h1>
          {!loading && <span className="text-sm text-muted">共 {total.toLocaleString()} 部</span>}
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="搜索动漫名称..."
              className="w-full sm:w-44 h-9 pl-9 pr-3 rounded-lg bg-accent/50 border border-border text-sm focus:outline-none focus:border-primary placeholder:text-muted"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          </form>
          {hasFilters && (
            <button onClick={() => router.push("/category")}
              className="text-xs text-muted hover:text-primary flex items-center gap-1 transition-colors shrink-0">
              <RotateCcw className="w-3 h-3" /> 重置
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2.5 p-4 rounded-xl bg-card border border-border">
        {/* 年份 + 季度（同一行） */}
        <div className="flex items-start gap-3 flex-wrap">
          <span className="text-muted text-sm w-12 shrink-0 pt-1 font-medium">年份</span>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => updateParam("year", "")}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                !year ? "bg-primary text-white shadow-sm" : "bg-accent/50 text-muted hover:text-primary hover:bg-accent"
              }`}>全部</button>
            {yearOptions.map((y) => (
              <button key={y} onClick={() => updateParam("year", y)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  year === y ? "bg-primary text-white shadow-sm" : "bg-accent/50 text-muted hover:text-primary hover:bg-accent"
                }`}>{y}年</button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 flex-wrap">
          <span className="text-muted text-sm w-12 shrink-0 pt-1 font-medium">季度</span>
          <div className="flex flex-wrap gap-1.5">
            {quarterOptions.map((opt) => (
              <button key={opt.value} onClick={() => updateParam("quarter", opt.value)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  quarter === opt.value ? "bg-primary text-white shadow-sm" : "bg-accent/50 text-muted hover:text-primary hover:bg-accent"
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* 排序 */}
        <div className="flex items-start gap-3">
          <span className="text-muted text-sm w-12 shrink-0 pt-1 font-medium">排序</span>
          <div className="flex flex-wrap gap-1.5">
            {sortOptions.map((opt) => (
              <button key={opt.value} onClick={() => updateParam("sort", opt.value)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  sort === opt.value ? "bg-primary text-white shadow-sm" : "bg-accent/50 text-muted hover:text-primary hover:bg-accent"
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <Loading />
      ) : animes.length === 0 ? (
        <div className="text-center py-20 text-muted space-y-2">
          <p>{q ? `搜索"${q}"未找到结果` : "暂无结果"}</p>
          {hasFilters && (
            <button onClick={() => router.push("/category")} className="text-primary text-sm hover:underline">清除筛选条件试试</button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {animes.map((anime) => {
              const hasImage = anime.vod_pic && (anime.vod_pic.startsWith("http://") || anime.vod_pic.startsWith("https://"));
              return (
                <Link key={anime.vod_id} href={`/anime/play/${anime.vod_id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card">
                    {hasImage ? (
                      <Image src={anime.vod_pic} alt={anime.vod_name} fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
                        unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-300 via-pink-200 to-rose-200 flex items-center justify-center p-2">
                        <span className="text-pink-700 text-xs font-bold text-center line-clamp-3">{anime.vod_name}</span>
                      </div>
                    )}
                    {anime.vod_remarks && (
                      <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary text-white text-[10px] rounded">{anime.vod_remarks}</span>
                    )}
                    {anime.vod_score && parseFloat(anime.vod_score) > 0 && (
                      <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 bg-yellow-500/90 text-white text-[10px] rounded">
                        <Star className="w-2.5 h-2.5" /> {anime.vod_score}
                      </span>
                    )}
                    {/* Play overlay - always visible on mobile, on hover on desktop */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg scale-75 group-hover:scale-100">
                        <Play className="w-5 h-5 ml-0.5" />
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <h3 className="text-white text-xs font-medium line-clamp-2 drop-shadow-lg">{anime.vod_name}</h3>
                      <p className="text-white/60 text-[10px]">{anime.vod_year} {anime.vod_area}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <Pagination current={page} total={totalPages} onChange={(p) => updateParam("page", p.toString())} />
          )}
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
