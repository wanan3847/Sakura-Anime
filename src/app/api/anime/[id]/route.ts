import { NextRequest, NextResponse } from "next/server";
import { getAnimeDetail } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getAnimeDetail(id);
    if (!data) {
      return NextResponse.json({ error: "动漫不存在" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取数据失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
