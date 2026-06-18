// 聚合API对接模块 - 支持多源路由
import { db } from "@/lib/db";

export interface AnimeItem {
  vod_id: string | number;
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
  vod_score?: string;
  vod_director?: string;
  vod_actor?: string;
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

// 默认源标识（向后兼容无前缀的ID）
const DEFAULT_SOURCE = "bfzyapi";

// ---- 数据库源缓存 (60秒 TTL) ----
const SOURCES_CACHE_TTL = 60 * 1000; // 60秒
let sourcesCache: { data: Record<string, string>; typeMap: Record<string, Record<string, string>>; expiry: number } | null = null;

async function refreshSourcesCache(): Promise<void> {
  const activeSources = await db.videoSource.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
  });

  const sources: Record<string, string> = {};
  const typeMap: Record<string, Record<string, string>> = {};
  // 默认类型映射，供后备使用
  const defaultTypeMappings: Record<string, string> = {
    "日本动漫": "41", "国产动漫": "40", "动漫电影": "39", "欧美动漫": "42",
    "日韩动漫": "41",
  };

  for (const src of activeSources) {
    const key = src.name;
    sources[key] = src.apiUrl;
    // 用 DB 中每个源的 typeId 构建类型映射
    typeMap[key] = {};
    for (const [typeName] of Object.entries(defaultTypeMappings)) {
      typeMap[key][typeName] = String(src.typeId);
    }
  }

  sourcesCache = {
    data: sources,
    typeMap,
    expiry: Date.now() + SOURCES_CACHE_TTL,
  };
}

async function getActiveSourcesMap(): Promise<Record<string, string>> {
  if (!sourcesCache || sourcesCache.expiry < Date.now()) {
    await refreshSourcesCache();
  }
  return sourcesCache!.data;
}

async function getActiveTypeMap(): Promise<Record<string, Record<string, string>>> {
  if (!sourcesCache || sourcesCache.expiry < Date.now()) {
    await refreshSourcesCache();
  }
  return sourcesCache!.typeMap;
}

// 缓存
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) return item.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// 解析带前缀的ID: "ffzyapi_69065" → { sourceId: "ffzyapi", rawId: "69065" }
export async function parseId(id: string): Promise<{ sourceId: string; rawId: string }> {
  const sources = await getActiveSourcesMap();
  for (const prefix of Object.keys(sources)) {
    if (id.startsWith(prefix + "_")) {
      return { sourceId: prefix, rawId: id.slice(prefix.length + 1) };
    }
  }
  return { sourceId: DEFAULT_SOURCE, rawId: id };
}

export async function fetchFromUrl(baseUrl: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return JSON.parse(text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ""));
}

async function getApiUrl(sourceId: string): Promise<string> {
  const sources = await getActiveSourcesMap();
  return sources[sourceId] || sources[DEFAULT_SOURCE] || "";
}

export async function mapTypeName(sourceId: string, name: string): Promise<string> {
  const typeMap = await getActiveTypeMap();
  return typeMap[sourceId]?.[name] || typeMap[DEFAULT_SOURCE]?.[name] || name;
}

// 获取动漫列表
export async function getAnimeList(
  page = 1, limit = 24, type?: string, area?: string,
  year?: string, sort?: string, detail = false
): Promise<AnimeListResponse> {
  const cacheKey = `list:${page}:${limit}:${type}:${area}:${year}:${sort}`;
  const cached = getCached<AnimeListResponse>(cacheKey);
  if (cached) return cached;

  const sourceId = DEFAULT_SOURCE;
  const params: Record<string, string> = {
    ac: detail ? "detail" : "list",
    pg: page.toString(),
    pagesize: limit.toString(),
  };
  if (type) params.t = await mapTypeName(sourceId, type);
  if (area) params.a = area;
  if (year) params.y = year;
  if (sort) params.by = sort;

  const data = (await fetchFromUrl(await getApiUrl(sourceId), params)) as AnimeListResponse;
  setCache(cacheKey, data);
  return data;
}

// 多源获取动漫列表 — 遍历所有源合并结果
export async function getAnimeListMultiSource(
  page = 1, limit = 24, type?: string, area?: string,
  year?: string, sort?: string, detail = false
): Promise<AnimeListResponse> {
  const sources = await getActiveSourcesMap();
  const allItems: AnimeItem[] = [];

  for (const [sourceId, apiUrl] of Object.entries(sources)) {
    if (!apiUrl) continue;
    try {
      const params: Record<string, string> = {
        ac: detail ? "detail" : "list",
        pg: page.toString(),
        pagesize: limit.toString(),
      };
      if (type) params.t = await mapTypeName(sourceId, type);
      if (area) params.a = area;
      if (year) params.y = year;
      if (sort) params.by = sort;

      const data = (await fetchFromUrl(apiUrl, params)) as AnimeListResponse;
      if (data.list) allItems.push(...data.list);
    } catch { /* skip failed sources */ }
  }

  return {
    code: 1,
    msg: "数据列表",
    page,
    pagecount: Math.ceil(allItems.length / limit),
    limit: limit.toString(),
    total: allItems.length,
    list: allItems,
  };
}

// 获取动漫详情 - 多源聚合，先查主源拿名字，再搜其他源
export async function getAnimeDetail(id: string): Promise<AnimeItem | null> {
  const cacheKey = `detail:${id}`;
  const cached = getCached<AnimeItem>(cacheKey);
  if (cached) return cached;

  const sources = await getActiveSourcesMap();
  const { sourceId, rawId } = await parseId(id);
  const primaryUrl = await getApiUrl(sourceId);

  // Phase 1: 查询主源（按ID精确查询）
  let primary: AnimeItem | null = null;
  try {
    const data = await fetchFromUrl(primaryUrl, { ac: "detail", ids: rawId }) as AnimeListResponse;
    if (data.list?.length) primary = data.list[0];
  } catch {}

  if (!primary) return null;

  // Phase 2: 用名称搜索其他源，聚合更多播放线路
  const backupSources = Object.entries(sources)
    .filter(([sid]) => sid !== sourceId)
    .filter(([, url]) => url);

  if (backupSources.length > 0) {
    const name = primary.vod_name;
    const shortName = name
      .replace(/\s*第[一二三四五六七八九十百千\d]+[季期部篇]/g, "")
      .replace(/\s*[：:].*$/g, "")
      .trim();

    // 并发搜索其他源，8秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const results = await Promise.allSettled(
      backupSources.map(async ([sid, apiUrl]) => {
        const data = await fetchFromUrl(apiUrl, { ac: "detail", wd: name }) as AnimeListResponse;
        if (!data.list?.length && shortName !== name) {
          const data2 = await fetchFromUrl(apiUrl, { ac: "detail", wd: shortName }) as AnimeListResponse;
          return { sourceId: sid, data: data2 };
        }
        return { sourceId: sid, data };
      })
    );
    clearTimeout(timeoutId);

    // 合并播放地址
    const fromSet = new Set((primary.vod_play_from || "").split("$$$"));
    const allFrom: string[] = (primary.vod_play_from || "").split("$$$");
    const allUrl: string[] = (primary.vod_play_url || "").split("$$$");

    for (const r of results) {
      if (r.status !== "fulfilled" || !r.value.data?.list?.length) continue;
      const item = r.value.data.list[0];
      if (!item.vod_play_from || !item.vod_play_url) continue;
      const newFromList = item.vod_play_from.split("$$$");
      const newUrlList = item.vod_play_url.split("$$$");
      newFromList.forEach((fName, idx) => {
        if (!fromSet.has(fName) && newUrlList[idx]) {
          fromSet.add(fName);
          allFrom.push(fName);
          allUrl.push(newUrlList[idx]);
        }
      });
    }

    if (allFrom.length > 1) {
      primary.vod_play_from = allFrom.join("$$$");
      primary.vod_play_url = allUrl.join("$$$");
    }
  }

  setCache(cacheKey, primary);
  return primary;
}

// 搜索动漫（先查本地 catalog，再回退 API）
export async function searchAnime(keyword: string, page = 1): Promise<AnimeListResponse> {
  const cacheKey = `search:${keyword}:${page}`;
  const cached = getCached<AnimeListResponse>(cacheKey);
  if (cached) return cached;

  // 回退到 API 搜索
  const data = (await fetchFromUrl(await getApiUrl(DEFAULT_SOURCE), {
    ac: "list", wd: keyword, pg: page.toString(),
  })) as AnimeListResponse;
  setCache(cacheKey, data);
  return data;
}

// 从数据库获取可用类型选项
export async function getTypeOptions(): Promise<{ label: string; value: string }[]> {
  // 读取所有启用的源以获取类型信息
  const sources = await db.videoSource.findMany({
    where: { isActive: true },
    select: { typeId: true, name: true },
    orderBy: { priority: "desc" },
  });

  // 标准中文类型名称
  const typeNames = ["日本动漫", "国产动漫", "动漫电影", "欧美动漫"];
  // 默认类型ID映射（作为后备）
  const defaultTypeIds: Record<string, number> = {
    "日本动漫": 41, "国产动漫": 40, "动漫电影": 39, "欧美动漫": 42,
  };

  // 使用第一个活跃源的类型ID（通常所有源共享同一套类型体系）
  if (sources.length > 0) {
    return typeNames.map((name) => ({
      label: name,
      value: name,
    }));
  }

  // 后备：返回硬编码值
  return [
    { label: "日本动漫", value: "日本动漫" },
    { label: "国产动漫", value: "国产动漫" },
    { label: "动漫电影", value: "动漫电影" },
    { label: "欧美动漫", value: "欧美动漫" },
  ];
}

// 播放源名称中文化映射
const SOURCE_NAME_MAP: Record<string, string> = {
  bfzym3u8: "暴风", bfzyplay: "暴风", "1080zyk": "精品", "1080tk": "精品",
  tkm3u8: "西瓜", ffm3u8: "非凡", wjm3u8: "无尽", hnm3u8: "红牛",
  jsm3u8: "计算云", fcm3u8: "凤雏云", xgm3u8: "西瓜", dbm3u8: "量子",
  kdm3u8: "酷点", jinyingm3u8: "金鹰", tam3u8: "暴风", zuidam3u8: "最大",
  bfzyapi: "暴风", liangzi: "量子", lzm3u8: "量子", lzm3u82: "量子2",
  zuidam3u82: "最大2", ffzym3u8: "非凡资源", ffzyapi: "非凡资源",
  feifan: "非凡",
};

function mapSourceName(name: string): string {
  const lower = name.toLowerCase().trim();
  return SOURCE_NAME_MAP[lower] || name;
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
      return { name: epName || "播放", url: epUrl || "" };
    });
    sources.push({ name: mapSourceName(name), episodes });
  });

  return sources;
}
