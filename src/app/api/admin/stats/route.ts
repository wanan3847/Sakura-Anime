import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const [users, sources, favorites, bugReports] = await Promise.all([
      db.user.count(),
      db.videoSource.count(),
      db.favorite.count(),
      db.comment.count({ where: { animeId: "bug-report" } }),
    ]);

    return NextResponse.json({ users, sources, favorites, bugReports });
  } catch {
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
