import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");

    if (!keyword) {
      return NextResponse.json({ error: "请输入搜索关键词" }, { status: 400 });
    }

    // 先从本地 catalog 搜索（更全面，支持多源）
    try {
      const items = await db.animeCatalog.findMany({
        where: {
          OR: [
            { name: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: 20,
        skip: (page - 1) * 20,
        orderBy: { updatedAt: "desc" },
      });

      if (items.length > 0) {
        const total = await db.animeCatalog.count({
          where: {
            OR: [
              { name: { contains: keyword } },
              { description: { contains: keyword } },
            ],
          },
        });

        return NextResponse.json({
          code: 1,
          msg: "数据列表",
          page,
          pagecount: Math.ceil(total / 20),
          limit: "20",
          total,
          list: items.map((item) => ({
            vod_id: item.id, // 带前缀的ID (如 ffzyapi_69065)
            vod_name: item.name,
            vod_pic: item.cover || "",
            vod_year: item.year?.toString() || "",
            vod_area: item.area || "",
            vod_remarks: item.remarks || "",
            vod_content: item.description || "",
            vod_play_from: "",
            vod_play_url: "",
            type_name: item.type || "",
            vod_time: "",
            vod_class: item.className || "",
            vod_score: item.score || "",
          })),
        });
      }
    } catch {
      // fallback to API
    }

    // 回退到 API 搜索
    const data = await searchAnime(keyword, page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "搜索失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
