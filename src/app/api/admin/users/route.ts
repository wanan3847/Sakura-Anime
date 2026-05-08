import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function checkAdmin(session: unknown) {
  return ((session as { user?: { role?: string } })?.user?.role) === "admin";
}

// 获取用户列表
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

    const [users, total] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count(),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch {
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

// 更新用户角色
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const adminId = (session as { user?: { id?: string } })?.user?.id;
    if (userId === adminId) {
      return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "更新用户角色失败" }, { status: 500 });
  }
}

// 删除用户
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    const adminId = (session as { user?: { id?: string } })?.user?.id;
    if (userId === adminId) {
      return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
