import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// 获取所有视频源
export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
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
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { name, apiUrl, isActive, priority } = body;

    const source = await db.videoSource.create({
      data: { name, apiUrl, isActive, priority },
    });

    return NextResponse.json(source);
  } catch {
    return NextResponse.json({ error: "添加视频源失败" }, { status: 500 });
  }
}
