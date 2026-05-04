import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function getUserId(session: unknown): string | null {
  return ((session as { user?: { id?: string } })?.user?.id) || null;
}

// 获取收藏列表
export async function GET() {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const favorites = await db.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json({ error: "获取收藏失败" }, { status: 500 });
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { animeId, animeName, animeCover } = body;

    const favorite = await db.favorite.create({
      data: {
        animeId,
        animeName,
        animeCover,
        userId,
      },
    });

    return NextResponse.json(favorite);
  } catch {
    return NextResponse.json({ error: "添加收藏失败" }, { status: 500 });
  }
}

// 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get("animeId");

    if (!animeId) {
      return NextResponse.json({ error: "缺少animeId" }, { status: 400 });
    }

    await db.favorite.deleteMany({
      where: {
        animeId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "取消收藏失败" }, { status: 500 });
  }
}
