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

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");

  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchData = useCallback(async () => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setAnimes(data.list || []);
        setTotalPages(data.pagecount || 1);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索动漫..."
          className="flex-1 h-12 px-4 rounded-lg bg-card border border-border text-white placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="px-6 h-12 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          搜索
        </button>
      </form>

      {/* 结果 */}
      {loading ? (
        <Loading />
      ) : q ? (
        <>
          <p className="text-muted text-sm">
            搜索 &ldquo;<span className="text-white">{q}</span>&rdquo; 找到 {animes.length} 个结果
          </p>
          <AnimeGrid animes={animes} />
          <Pagination
            current={page}
            total={totalPages}
            onChange={(p) => router.push(`/search?q=${encodeURIComponent(q)}&page=${p}`)}
          />
        </>
      ) : (
        <p className="text-center text-muted py-20">请输入搜索关键词</p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchContent />
    </Suspense>
  );
}
