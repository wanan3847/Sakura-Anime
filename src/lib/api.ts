// 聚合API对接模块 - 兼容CMS采集标准接口
// 支持 /api.php/provide/vod/ 格式

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

const API_URL = process.env.ANIME_API_URL || "";
const API_BACKUP_URL = process.env.ANIME_API_BACKUP_URL || "";
const API_WUJIN_URL = process.env.ANIME_API_WUJIN_URL || "";
const API_LZI_URL = process.env.ANIME_API_LZI_URL || "";
const API_FFZY_URL = process.env.ANIME_API_FFZY_URL || "";

// 动漫类型名称到API类型ID的映射（兼容bfzyapi等CMS采集站）
const TYPE_MAP: Record<string, string> = {
  "日本动漫": "41",
  "国产动漫": "40",
  "动漫电影": "39",
  "欧美动漫": "42",
  "港台动漫": "43",
  "海外动漫": "44",
};

export function mapTypeName(name: string): string {
  return TYPE_MAP[name] || name;
}

export function getTypeOptions() {
  return [
    { label: "日本动漫", value: "日本动漫" },
    { label: "国产动漫", value: "国产动漫" },
    { label: "动漫电影", value: "动漫电影" },
    { label: "欧美动漫", value: "欧美动漫" },
  ];
}

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

async function fetchFromUrl(baseUrl: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function fetchAPI(params: Record<string, string>): Promise<unknown> {
  if (!API_URL) throw new Error("未配置ANIME_API_URL");

  try {
    return await fetchFromUrl(API_URL, params);
  } catch (primaryError) {
    if (API_BACKUP_URL) {
      try {
        return await fetchFromUrl(API_BACKUP_URL, params);
      } catch {
        // 备用源也失败，继续抛出主源错误
      }
    }
    throw primaryError;
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
  if (type) params.t = mapTypeName(type);
  if (area) params.a = area;
  if (year) params.y = year;
  if (sort) params.sort = sort;

  const data = (await fetchAPI(params)) as AnimeListResponse;
  setCache(cacheKey, data);
  return data;
}

// 获取动漫详情 - 合并多个API源的播放地址
export async function getAnimeDetail(id: string): Promise<AnimeItem | null> {
  const cacheKey = `detail:${id}`;
  const cached = getCached<AnimeItem>(cacheKey);
  if (cached) return cached;

  const data = (await fetchAPI({ ac: "detail", ids: id })) as AnimeListResponse;
  if (!data.list || data.list.length === 0) return null;

  const primary = data.list[0];

  // 尝试从其他API源获取额外的播放地址（AAC音频兼容性更好）
  const extraSources = await fetchExtraPlaySources(primary.vod_name, primary.vod_play_from, primary.vod_play_url);
  if (extraSources) {
    primary.vod_play_from = extraSources.from;
    primary.vod_play_url = extraSources.url;
  }

  setCache(cacheKey, primary);
  return primary;
}

// 从备用API获取额外播放源，合并到主源中
async function fetchExtraPlaySources(
  animeName: string,
  existingFrom: string,
  existingUrl: string,
): Promise<{ from: string; url: string } | null> {
  const extraApis = [API_BACKUP_URL, API_WUJIN_URL, API_LZI_URL, API_FFZY_URL].filter((u) => u && u !== API_URL);
  if (extraApis.length === 0) return null;

  const existingFromSet = new Set((existingFrom || "").split("$$$"));
  const allFrom: string[] = (existingFrom || "").split("$$$");
  const allUrl: string[] = (existingUrl || "").split("$$$");

  // 生成多个搜索关键词（CMS搜索对长标题+季数后缀匹配差）
  const searchKeywords = [animeName];
  const shortName = animeName
    .replace(/\s*第[一二三四五六七八九十百千\d]+[季期部篇]/g, "")
    .replace(/\s*[：:].*$/g, "")
    .trim();
  if (shortName && shortName !== animeName && shortName.length >= 2) {
    searchKeywords.push(shortName);
  }

  for (const apiUrl of extraApis) {
    let matchFound = false;
    for (const keyword of searchKeywords) {
      if (matchFound) break;
      try {
        const data = (await fetchFromUrl(apiUrl, {
          ac: "detail",
          wd: keyword,
        })) as AnimeListResponse;

        if (!data.list || data.list.length === 0) continue;

        // 找到名字最匹配的结果
        const match = data.list.find(
          (item) => item.vod_name === animeName || item.vod_name.includes(shortName) || animeName.includes(item.vod_name),
        );
        if (!match || !match.vod_play_from || !match.vod_play_url) continue;

        matchFound = true;
        const newFromList = match.vod_play_from.split("$$$");
        const newUrlList = match.vod_play_url.split("$$$");

        newFromList.forEach((name, idx) => {
          if (!existingFromSet.has(name) && newUrlList[idx]) {
            allFrom.push(name);
            allUrl.push(newUrlList[idx]);
            existingFromSet.add(name);
          }
        });
      } catch {
        // 忽略备用源错误
      }
    }
  }

  if (allFrom.length > (existingFrom || "").split("$$$").length) {
    return { from: allFrom.join("$$$"), url: allUrl.join("$$$") };
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

// 播放源名称中文化映射
const SOURCE_NAME_MAP: Record<string, string> = {
  bfzym3u8: "暴风",
  bfzyplay: "暴风",
  "1080zyk": "精品",
  "1080tk": "精品",
  tkm3u8: "西瓜",
  ffm3u8: "非凡",
  wjm3u8: "无尽",
  hnm3u8: "红牛",
  jsm3u8: "计算云",
  fcm3u8: "凤雏云",
  xgm3u8: "西瓜",
  dbm3u8: "量子",
  kdm3u8: "酷点",
  jinyingm3u8: "金鹰",
  tam3u8: "暴风",
  zuidam3u8: "最大",
  bfzyapi: "暴风",
  liangzi: "量子",
  lzm3u8: "量子",
  lzm3u82: "量子2",
  zuidam3u82: "最大2",
  ffzym3u8: "非凡资源",
  ffzyapi: "非凡资源",
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
      return {
        name: epName || "播放",
        url: epUrl || "",
      };
    });
    sources.push({ name: mapSourceName(name), episodes });
  });

  return sources;
}
