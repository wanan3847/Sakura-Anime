import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function checkAdmin(session: unknown) {
  return ((session as { user?: { role?: string } })?.user?.role) === "admin";
}

// 获取所有视频源
export async function GET() {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const sources = await db.videoSource.findMany({
      orderBy: { priority: "desc" },
    });

    return NextResponse.json(sources);
  } catch {
    return NextResponse.json({ error: "获取视频源失败" }, { status: 500 });
  }
}

// 添加视频源
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { name, apiUrl, isActive, priority, typeId } = body;

    const source = await db.videoSource.create({
      data: { name, apiUrl, isActive, priority, typeId },
    });

    return NextResponse.json(source);
  } catch {
    return NextResponse.json({ error: "添加视频源失败" }, { status: 500 });
  }
}

// 更新视频源
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, apiUrl, priority, typeId } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少视频源ID" }, { status: 400 });
    }

    const source = await db.videoSource.update({
      where: { id },
      data: { name, apiUrl, priority, typeId },
    });

    return NextResponse.json(source);
  } catch {
    return NextResponse.json({ error: "更新视频源失败" }, { status: 500 });
  }
}

// 删除视频源
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少视频源ID" }, { status: 400 });
    }

    await db.videoSource.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除视频源失败" }, { status: 500 });
  }
}

// 切换视频源启用状态
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少视频源ID" }, { status: 400 });
    }

    const source = await db.videoSource.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(source);
  } catch {
    return NextResponse.json({ error: "切换状态失败" }, { status: 500 });
  }
}
