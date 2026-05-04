// 聚合API对接模块 - 兼容CMS采集标准接口
// 支持 /api.php/provide/vod/ 格式

export interface AnimeItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_year: string;
  vod_area: string;
  vod_remarks: string;
  vod_content: string;
  vod_play_from: string;
  vod_play_url: string;
  type_name: string;
  vod_time: string;
  vod_class: string;
}

export interface AnimeListResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: AnimeItem[];
}

export interface PlaySource {
  name: string;
  episodes: Episode[];
}

export interface Episode {
  name: string;
  url: string;
}

const API_URL = process.env.ANIME_API_URL || "";
const API_BACKUP_URL = process.env.ANIME_API_BACKUP_URL || "";

// 缓存
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

async function fetchAPI(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 300 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    // 尝试备用源
    if (API_BACKUP_URL) {
      const backupUrl = new URL(API_BACKUP_URL);
      Object.entries(params).forEach(([key, value]) => {
        backupUrl.searchParams.set(key, value);
      });
      const res = await fetch(backupUrl.toString());
      if (!res.ok) throw new Error(`Backup HTTP ${res.status}`);
      return await res.json();
    }
    throw new Error("所有API源不可用");
  }
}

// 获取动漫列表
export async function getAnimeList(
  page = 1,
  limit = 24,
  type?: string,
  area?: string,
  year?: string,
  sort?: string
): Promise<AnimeListResponse> {
  const cacheKey = `list:${page}:${limit}:${type}:${area}:${year}:${sort}`;
  const cached = getCached<AnimeListResponse>(cacheKey);
  if (cached) return cached;

  const params: Record<string, string> = {
    ac: "list",
    pg: page.toString(),
    pagesize: limit.toString(),
  };
  if (type) params.t = type;
  if (area) params.a = area;
  if (year) params.y = year;
  if (sort) params.sort = sort;

  const data = (await fetchAPI(params)) as AnimeListResponse;
  setCache(cacheKey, data);
  return data;
}

// 获取动漫详情
export async function getAnimeDetail(id: string): Promise<AnimeItem | null> {
  const cacheKey = `detail:${id}`;
  const cached = getCached<AnimeItem>(cacheKey);
  if (cached) return cached;

  const data = (await fetchAPI({ ac: "detail", ids: id })) as AnimeListResponse;
  if (data.list && data.list.length > 0) {
    setCache(cacheKey, data.list[0]);
    return data.list[0];
  }
  return null;
}

// 搜索动漫
export async function searchAnime(keyword: string, page = 1): Promise<AnimeListResponse> {
  const cacheKey = `search:${keyword}:${page}`;
  const cached = getCached<AnimeListResponse>(cacheKey);
  if (cached) return cached;

  const data = (await fetchAPI({
    ac: "list",
    wd: keyword,
    pg: page.toString(),
  })) as AnimeListResponse;
  setCache(cacheKey, data);
  return data;
}

// 解析播放地址
export function parsePlaySources(vodPlayFrom: string, vodPlayUrl: string): PlaySource[] {
  if (!vodPlayFrom || !vodPlayUrl) return [];

  const sources: PlaySource[] = [];
  const fromList = vodPlayFrom.split("$$$");
  const urlList = vodPlayUrl.split("$$$");

  fromList.forEach((name, index) => {
    const urlStr = urlList[index] || "";
    const episodes: Episode[] = urlStr.split("#").filter(Boolean).map((ep) => {
      const [epName, epUrl] = ep.split("$");
      return {
        name: epName || "播放",
        url: epUrl || "",
      };
    });
    sources.push({ name, episodes });
  });

  return sources;
}
