import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const [users, sources, danmakus, favorites] = await Promise.all([
      db.user.count(),
      db.videoSource.count(),
      db.danmaku.count(),
      db.favorite.count(),
    ]);

    return NextResponse.json({ users, sources, danmakus, favorites });
  } catch {
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
