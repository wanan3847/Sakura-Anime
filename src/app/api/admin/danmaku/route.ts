import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function checkAdmin(session: unknown) {
  return ((session as { user?: { role?: string } })?.user?.role) === "admin";
}

// 获取弹幕列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [danmakus, total] = await Promise.all([
      db.danmaku.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.danmaku.count(),
    ]);

    return NextResponse.json({ danmakus, total, page, limit });
  } catch {
    return NextResponse.json({ error: "获取弹幕列表失败" }, { status: 500 });
  }
}

// 删除单条弹幕
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少弹幕ID" }, { status: 400 });
    }

    await db.danmaku.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除弹幕失败" }, { status: 500 });
  }
}

// 批量删除弹幕
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "缺少弹幕ID列表" }, { status: 400 });
    }

    const result = await db.danmaku.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch {
    return NextResponse.json({ error: "批量删除失败" }, { status: 500 });
  }
}
