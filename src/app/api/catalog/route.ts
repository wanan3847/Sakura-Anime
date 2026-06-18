// 目录查询 API — 按年份+季度筛选，从本地 AnimeCatalog 表查询
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CatalogRow = Record<string, any>;

function getQuarter(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;
    const keyword = searchParams.get("q") || undefined;
    const sort = searchParams.get("sort") || "updatedAt";

    const conditions: string[] = [];
    const params: unknown[] = [];

    // 始终只查日本动漫
    conditions.push("type = ?");
    params.push("日本动漫");

    if (year) {
      conditions.push("year = ?");
      params.push(year);
    }

    if (keyword) {
      // 只搜名称，不搜描述，避免不相关结果
      conditions.push("name LIKE ?");
      params.push(`%${keyword}%`);
    }

    if (quarter && year) {
      // 从 vodTime 推算季度: vodTime 格式 "2025-07-14"
      const qStart = (quarter - 1) * 3 + 1;
      const qEnd = quarter * 3;
      conditions.push(
        "vodTime IS NOT NULL AND CAST(strftime('%m', vodTime) AS INTEGER) >= ? AND CAST(strftime('%m', vodTime) AS INTEGER) <= ?"
      );
      params.push(qStart, qEnd);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const skip = (page - 1) * limit;

    // Count query (dedup by name)
    const countResult = await db.$queryRawUnsafe<[{ cnt: number }]>(
      `SELECT COUNT(DISTINCT name) as cnt FROM AnimeCatalog ${whereClause}`,
      ...params
    );
    const total = Number(countResult[0].cnt);

    // Sort
    let orderClause: string;
    if (sort === "year") {
      orderClause = "ORDER BY year DESC, vodTime DESC NULLS LAST";
    } else if (sort === "score") {
      orderClause = "ORDER BY CAST(score AS REAL) DESC";
    } else {
      orderClause = "ORDER BY updatedAt DESC";
    }

    // Dedup by name: keep only the latest record per anime name
    const items = (await db.$queryRawUnsafe(
      `SELECT * FROM (SELECT *, row_number() OVER (PARTITION BY name ORDER BY updatedAt DESC) as rn FROM AnimeCatalog ${whereClause}) WHERE rn = 1 ${orderClause} LIMIT ? OFFSET ?`,
      ...params, limit, skip
    )) as CatalogRow[];

    return NextResponse.json({
      list: items.map((item) => ({
        vod_id: item.id,
        vod_name: item.name,
        vod_pic: item.cover || "",
        vod_year: item.year?.toString() || "",
        vod_area: item.area || "",
        vod_remarks: item.remarks || "",
        vod_content: item.description || "",
        vod_class: item.className || "",
        vod_score: item.score || "",
        type_name: item.type || "",
        sourceId: item.sourceId,
      })),
      page,
      limit,
      total,
      pagecount: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "查询失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
