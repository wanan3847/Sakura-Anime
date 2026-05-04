import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function getUserId(session: unknown): string | null {
  return ((session as { user?: { id?: string } })?.user?.id) || null;
}

// 获取观看历史
export async function GET() {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const histories = await db.history.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(histories);
  } catch {
    return NextResponse.json({ error: "获取历史失败" }, { status: 500 });
  }
}

// 更新观看历史
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { animeId, animeName, animeCover, episodeId, episodeName, progress } = body;

    const history = await db.history.upsert({
      where: {
        animeId_episodeId_userId: {
          animeId,
          episodeId: episodeId || "",
          userId,
        },
      },
      update: {
        progress: progress || 0,
        watchedAt: new Date(),
      },
      create: {
        animeId,
        animeName,
        animeCover,
        episodeId: episodeId || "",
        episodeName,
        progress: progress || 0,
        userId,
      },
    });

    return NextResponse.json(history);
  } catch {
    return NextResponse.json({ error: "更新历史失败" }, { status: 500 });
  }
}
