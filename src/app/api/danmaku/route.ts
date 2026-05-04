import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// 获取弹幕列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get("animeId");
    const episodeId = searchParams.get("episodeId");

    if (!animeId || !episodeId) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const danmakus = await db.danmaku.findMany({
      where: { animeId, episodeId },
      orderBy: { time: "asc" },
    });

    return NextResponse.json(danmakus);
  } catch {
    return NextResponse.json({ error: "获取弹幕失败" }, { status: 500 });
  }
}

// 发送弹幕
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { animeId, episodeId, text, color, type, time } = body;

    if (!animeId || !episodeId || !text || time === undefined) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const danmaku = await db.danmaku.create({
      data: {
        animeId,
        episodeId,
        text,
        color: color || "#ffffff",
        type: type || 0,
        time,
        userId: (session?.user as { id?: string })?.id || null,
      },
    });

    return NextResponse.json(danmaku);
  } catch {
    return NextResponse.json({ error: "发送弹幕失败" }, { status: 500 });
  }
}
