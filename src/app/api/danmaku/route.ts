import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// 获取弹幕列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // DPlayer 发送 id=${animeId}_${episodeId} 格式
    let animeId = searchParams.get("animeId");
    let episodeId = searchParams.get("episodeId");

    if (!animeId || !episodeId) {
      const id = searchParams.get("id");
      if (id) {
        // animeId 是数字，episodeId 是URL，用第一个下划线分割
        const firstUnderscore = id.indexOf("_");
        if (firstUnderscore > 0) {
          animeId = id.substring(0, firstUnderscore);
          episodeId = id.substring(firstUnderscore + 1);
        }
      }
    }

    if (!animeId || !episodeId) {
      return NextResponse.json({ data: [] });
    }

    const danmakus = await db.danmaku.findMany({
      where: { animeId, episodeId },
      orderBy: { time: "asc" },
    });

    // DPlayer 期望 { data: [[time, type, color, author, text], ...] }
    const formatted = danmakus.map((d) => [d.time, d.type, d.color, d.userId || "", d.text]);
    return NextResponse.json({ data: formatted });
  } catch (e) {
    console.error("获取弹幕失败:", e);
    return NextResponse.json({ error: "获取弹幕失败", details: e instanceof Error ? e.message : String(e) }, { status: 500 });
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
  } catch (e) {
    console.error("发送弹幕失败:", e);
    return NextResponse.json({ error: "发送弹幕失败", details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
