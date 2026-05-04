import { NextRequest, NextResponse } from "next/server";
import { getAnimeList } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const type = searchParams.get("type") || undefined;
    const area = searchParams.get("area") || undefined;
    const year = searchParams.get("year") || undefined;
    const sort = searchParams.get("sort") || undefined;

    const data = await getAnimeList(page, limit, type, area, year, sort);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取数据失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
