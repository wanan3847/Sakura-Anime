import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function checkAdmin(session: unknown) {
  return ((session as { user?: { role?: string } })?.user?.role) === "admin";
}

// 获取所有轮播图（含禁用的）
export async function GET() {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    const items = await db.carousel.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 添加轮播图
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    const body = await request.json();
    const { title, subtitle, imageUrl, linkUrl, badge, order, isActive } = body;
    const item = await db.carousel.create({
      data: { title, subtitle, imageUrl, linkUrl, badge, order: order || 0, isActive: isActive !== false },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}

// 更新轮播图
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    const item = await db.carousel.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除轮播图
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    await db.carousel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
