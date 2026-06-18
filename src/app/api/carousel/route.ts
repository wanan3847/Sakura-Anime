import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 获取轮播图列表（公开接口）
export async function GET() {
  try {
    const items = await db.carousel.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "获取轮播图失败" }, { status: 500 });
  }
}
