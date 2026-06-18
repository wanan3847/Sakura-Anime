import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// 获取评论列表（公开）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get("animeId");
    const episodeId = searchParams.get("episodeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!animeId) {
      return NextResponse.json({ error: "缺少 animeId" }, { status: 400 });
    }

    // 只获取顶层评论（没有 parentId 的）
    const where: Record<string, unknown> = { animeId, parentId: null };
    if (episodeId) {
      where.episodeId = episodeId;
    } else {
      where.episodeId = null;
    }

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.comment.count({ where }),
    ]);

    return NextResponse.json({
      list: comments,
      total,
      page,
      pagecount: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("获取评论失败:", e);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

// 发表评论
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { animeId, episodeId, text, rating, parentId } = body;

    if (!animeId || !text?.trim()) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        animeId,
        episodeId: episodeId || null,
        text: text.trim(),
        rating: rating && rating >= 1 && rating <= 5 ? rating : null,
        parentId: parentId || null,
        userId: (session?.user as { id?: string })?.id || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(comment);
  } catch (e) {
    console.error("发表评论失败:", e);
    return NextResponse.json({ error: "发表评论失败" }, { status: 500 });
  }
}

// 删除评论
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    const comment = await db.comment.findUnique({ where: { id } });
    if (!comment) return NextResponse.json({ error: "评论不存在" }, { status: 404 });

    const userId = (session.user as { id?: string }).id;
    const userRole = (session.user as { role?: string }).role;
    // 只允许本人或管理员删除
    if (comment.userId !== userId && userRole !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    // 删除评论及其回复（cascade）
    await db.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("删除评论失败:", e);
    return NextResponse.json({ error: "删除评论失败" }, { status: 500 });
  }
}
