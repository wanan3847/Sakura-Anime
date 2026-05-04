import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");

    if (!keyword) {
      return NextResponse.json({ error: "请输入搜索关键词" }, { status: 400 });
    }

    const data = await searchAnime(keyword, page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "搜索失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
