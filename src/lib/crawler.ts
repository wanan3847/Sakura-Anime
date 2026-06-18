// 采集器：从CMS API采集日本动漫数据，存入本地AnimeCatalog表
// 支持增量更新（只采集新数据）

import { db } from "@/lib/db";

interface CmsAnimeItem {
  vod_id: number | string;
  vod_name: string;
  vod_pic: string;
  vod_year: string;
  vod_area: string;
  vod_remarks: string;
  vod_content: string;
  vod_class: string;
  vod_score: string;
  type_name: string;
  vod_time: string; // e.g. "2025-07-14"
}

interface CmsResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: number;
  total: number;
  list: CmsAnimeItem[];
}

// 只采日本动漫，每源有自己的 typeId
// API源列表（每源日本动漫typeId不同）
const API_SOURCES = [
  { id: "bfzyapi", url: "https://bfzyapi.com/api.php/provide/vod/", typeId: 41 },
  { id: "zuidapi", url: "https://api.zuidapi.com/api.php/provide/vod/", typeId: 30 },
  { id: "ffzyapi", url: "https://cj.ffzyapi.com/api.php/provide/vod/", typeId: 30 },
];

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

async function fetchPage(apiUrl: string, type: number, page: number, pageSize = 100): Promise<CmsResponse | null> {
  const url = `${apiUrl}?ac=detail&t=${type}&pg=${page}&pagesize=${pageSize}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text) as CmsResponse;
  } catch (e) {
    console.error(`[Crawler] Failed: ${url} - ${e}`);
    return null;
  }
}

function isJapaneseArea(area: string): boolean {
  if (!area) return true; // 没有地区信息的默认为日本
  return area.includes("日本");
}

export interface CrawlProgress {
  sourceId: string;
  sourceUrl: string;
  typeId: number;
  typeName: string;
  page: number;
  totalPages: number;
  inserted: number;
  updated: number;
  skipped: number;
  done: boolean;
}

export async function* crawlAll(): AsyncGenerator<CrawlProgress> {
  for (const source of API_SOURCES) {
    const first = await fetchPage(source.url, source.typeId, 1, 100);
    if (!first || !first.list || first.list.length === 0) {
      console.log(`[Crawler] ${source.id}: no data`);
      continue;
    }

    const totalPages = first.pagecount;
    console.log(`[Crawler] ${source.id}: ${first.total} items, ${totalPages} pages`);

    let inserted = 0, updated = 0, skipped = 0;
    const result1 = await saveBatch(source.id, source.url, first.list);
    inserted += result1.inserted;
    updated += result1.updated;
    skipped += result1.skipped;

    yield { sourceId: source.id, sourceUrl: source.url, typeId: source.typeId, typeName: "日本动漫", page: 1, totalPages, inserted, updated, skipped, done: false };

    // 采集剩余页面（并发5个）
    const CONCURRENCY = 5;
    for (let batchStart = 2; batchStart <= totalPages; batchStart += CONCURRENCY) {
      const batchEnd = Math.min(batchStart + CONCURRENCY - 1, totalPages);
      const pages = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i);

      const results = await Promise.allSettled(
        pages.map((p) => fetchPage(source.url, source.typeId, p, 100))
      );

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "fulfilled" && r.value?.list) {
          const batch = await saveBatch(source.id, source.url, r.value.list);
          inserted += batch.inserted;
          updated += batch.updated;
          skipped += batch.skipped;
        }
      }

      yield {
        sourceId: source.id,
        sourceUrl: source.url,
        typeId: source.typeId,
        typeName: "日本动漫",
        page: batchEnd,
        totalPages,
        inserted,
        updated,
        skipped,
        done: batchEnd >= totalPages,
      };

      if (batchEnd < totalPages) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }
}

async function saveBatch(sourceId: string, sourceUrl: string, items: CmsAnimeItem[]) {
  let inserted = 0, updated = 0, skipped = 0;

  for (const item of items) {
    // 过滤非日本动漫
    if (!isJapaneseArea(item.vod_area)) {
      skipped++;
      continue;
    }

    const id = `${sourceId}_${item.vod_id}`;
    const year = item.vod_year ? parseInt(item.vod_year) : null;
    const vodTime = item.vod_time || null;

    try {
      const existing = await db.animeCatalog.findUnique({ where: { id } });
      if (existing) {
        await db.animeCatalog.update({
          where: { id },
          data: {
            name: item.vod_name,
            cover: item.vod_pic || null,
            year,
            area: item.vod_area || null,
            type: "日本动漫",
            className: item.vod_class || null,
            remarks: item.vod_remarks || null,
            score: item.vod_score || null,
            description: stripHtml(item.vod_content),
            vodTime,
            sourceUrl,
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        await db.animeCatalog.create({
          data: {
            id,
            name: item.vod_name,
            cover: item.vod_pic || null,
            year,
            area: item.vod_area || null,
            type: "日本动漫",
            className: item.vod_class || null,
            remarks: item.vod_remarks || null,
            score: item.vod_score || null,
            description: stripHtml(item.vod_content),
            vodTime,
            sourceId,
            sourceUrl,
          },
        });
        inserted++;
      }
    } catch (e) {
      skipped++;
    }
  }

  return { inserted, updated, skipped };
}

// 快速采集：只采集第1页获取最新数据
export async function crawlQuick(): Promise<{ total: number }> {
  let total = 0;
  for (const source of API_SOURCES) {
    const first = await fetchPage(source.url, source.typeId, 1, 100);
    if (!first?.list) continue;
    const result = await saveBatch(source.id, source.url, first.list);
    total += result.inserted + result.updated;
  }
  return { total };
}
