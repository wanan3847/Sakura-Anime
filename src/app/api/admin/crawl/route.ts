// 采集 API — POST /api/admin/crawl
// ?quick=true 轻量模式（只爬第1页，约3秒完成）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// NOTE: CRAWL_API_KEY is read from env. Default is only for dev convenience.
const CRAWL_API_KEY = process.env.CRAWL_API_KEY || "crawl-sakura-2026";

const API_SOURCES = [
  {
    id: "bfzyapi",
    url: process.env.ANIME_API_URL || "https://bfzyapi.com/api.php/provide/vod/",
    types: [{ id: 41, name: "日本动漫" }],
  },
  {
    id: "ffzyapi",
    url: process.env.ANIME_API_FFZY_URL || "https://cj.ffzyapi.com/api.php/provide/vod/",
    types: [{ id: 30, name: "日本动漫" }],
  },
  {
    id: "zuidapi",
    url: process.env.ANIME_API_BACKUP_URL || "https://api.zuidapi.com/api.php/provide/vod/",
    types: [{ id: 30, name: "日本动漫" }],
  },
];

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

function isJapaneseArea(area: string): boolean {
  if (!area) return true; // 无地区信息默认为日本
  return area.includes("日本");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPage(apiUrl: string, typeId: number, page: number, pageSize = 100): Promise<any> {
  const url = `${apiUrl}?ac=detail&t=${typeId}&pg=${page}&pagesize=${pageSize}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ""));
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveBatch(sourceId: string, apiUrl: string, items: any[]) {
  let saved = 0;
  for (const item of items) {
    if (!isJapaneseArea(item.vod_area)) continue;

    const id = `${sourceId}_${item.vod_id}`;
    const year = item.vod_year ? parseInt(item.vod_year) : null;
    const vodTime = item.vod_time || null;

    try {
      await db.animeCatalog.upsert({
        where: { id },
        update: {
          name: item.vod_name || "未知",
          cover: item.vod_pic || null,
          year: year && !isNaN(year) ? year : null,
          area: item.vod_area || null,
          type: "日本动漫",
          className: item.vod_class || null,
          remarks: item.vod_remarks || null,
          score: item.vod_score || null,
          description: stripHtml(item.vod_content),
          vodTime,
          sourceUrl: apiUrl,
        },
        create: {
          id,
          name: item.vod_name || "未知",
          cover: item.vod_pic || null,
          year: year && !isNaN(year) ? year : null,
          area: item.vod_area || null,
          type: "日本动漫",
          className: item.vod_class || null,
          remarks: item.vod_remarks || null,
          score: item.vod_score || null,
          description: stripHtml(item.vod_content),
          vodTime,
          sourceId,
          sourceUrl: apiUrl,
        },
      });
      saved++;
    } catch {
      // skip
    }
  }
  return saved;
}

export async function POST(request: NextRequest) {
  let authorized = false;
  try {
    const session = await auth();
    if (session?.user && (session.user as { role?: string }).role === "admin") {
      authorized = true;
    }
  } catch {}

  if (!authorized) {
    try {
      const body = await request.clone().json().catch(() => ({}));
      if (body?.key === CRAWL_API_KEY) authorized = true;
    } catch {}
  }

  if (!authorized) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const quick = searchParams.get("quick") === "true";

  try {
    let grandTotal = 0;
    const sourceDetails: { source: string; type: string; count: number }[] = [];

    for (const source of API_SOURCES) {
      for (const type of source.types) {
        const first = await fetchPage(source.url, type.id, 1, 100);
        if (!first?.list?.length) {
          sourceDetails.push({ source: source.id, type: type.name, count: 0 });
          continue;
        }

        if (quick) {
          // 轻量同步：只爬第1页
          const count = await saveBatch(source.id, source.url, first.list);
          grandTotal += count;
          sourceDetails.push({ source: source.id, type: type.name, count });
        } else {
          // 全量采集
          const totalPages = Math.min(first.pagecount, 100);
          let typeCount = await saveBatch(source.id, source.url, first.list);

          for (let batchStart = 2; batchStart <= totalPages; batchStart += 3) {
            const batchEnd = Math.min(batchStart + 2, totalPages);
            const pages = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i);
            const results = await Promise.allSettled(pages.map((p) => fetchPage(source.url, type.id, p, 100)));
            for (const r of results) {
              if (r.status === "fulfilled" && r.value?.list?.length) {
                typeCount += await saveBatch(source.id, source.url, r.value.list);
              }
            }
            if (batchEnd < totalPages) await new Promise(r => setTimeout(r, 300));
          }

          grandTotal += typeCount;
          sourceDetails.push({ source: source.id, type: type.name, count: typeCount });
        }
      }
    }

    const dbTotal = await db.animeCatalog.count();
    return NextResponse.json({
      success: true,
      mode: quick ? "quick" : "full",
      total: grandTotal,
      dbTotal,
      details: sourceDetails,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
