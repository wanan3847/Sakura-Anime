import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function isAdmin(session: unknown): boolean {
  return ((session as { user?: { role?: string } })?.user?.role) === "admin";
}

function getUserId(session: unknown): string | undefined {
  return (session as { user?: { id?: string } })?.user?.id;
}

// GET /api/notifications — Return notifications for current user (own + global)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: Record<string, unknown> = {
      OR: [{ userId }, { userId: null }],
    };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({ where }),
    ]);

    // Count unread
    const unreadCount = await db.notification.count({
      where: { OR: [{ userId }, { userId: null }], read: false },
    });

    return NextResponse.json({ list: notifications, total, unreadCount });
  } catch (e) {
    console.error("获取通知失败:", e);
    return NextResponse.json({ error: "获取通知失败" }, { status: 500 });
  }
}

// POST /api/notifications — Admin only. Create notification.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, title, message, type } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "缺少标题或消息" }, { status: 400 });
    }

    // Handle "all" keyword — no need to create per-user, just create global
    const targetUserId =
      userId === "all" || !userId ? null : userId;

    const notification = await db.notification.create({
      data: {
        userId: targetUserId,
        title: title.trim(),
        message: message.trim(),
        type: type || "system",
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(notification);
  } catch (e) {
    console.error("创建通知失败:", e);
    return NextResponse.json({ error: "创建通知失败" }, { status: 500 });
  }
}

// DELETE /api/notifications?id=xxx — Admin only. Delete.
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    await db.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("删除通知失败:", e);
    return NextResponse.json({ error: "删除通知失败" }, { status: 500 });
  }
}

// PATCH /api/notifications?id=xxx — Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      // Mark all as read
      await db.notification.updateMany({
        where: { OR: [{ userId }, { userId: null }], read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    // Mark single notification as read
    const notif = await db.notification.findUnique({ where: { id } });
    if (!notif) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 });
    }
    // Only allow marking own notifications
    if (notif.userId !== null && notif.userId !== userId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("更新通知失败:", e);
    return NextResponse.json({ error: "更新通知失败" }, { status: 500 });
  }
}
