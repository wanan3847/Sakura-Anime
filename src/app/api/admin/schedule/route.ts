import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function checkAdmin(session: unknown) {
  return ((session as { user?: { role?: string } })?.user?.role) === "admin";
}

export async function GET() {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const schedules = await db.schedule.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch {
    return NextResponse.json({ error: "获取排期失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { animeId, animeName, animePic, dayOfWeek, timeSlot, remark } = await request.json();

    if (!animeId || !animeName || dayOfWeek === undefined) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const schedule = await db.schedule.create({
      data: { animeId, animeName, animePic, dayOfWeek, timeSlot, remark },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "添加排期失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id, animeName, animePic, dayOfWeek, timeSlot, remark } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "缺少排期ID" }, { status: 400 });
    }

    const schedule = await db.schedule.update({
      where: { id },
      data: { animeName, animePic, dayOfWeek, timeSlot, remark },
    });

    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "更新排期失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少排期ID" }, { status: 400 });
    }

    await db.schedule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除排期失败" }, { status: 500 });
  }
}
