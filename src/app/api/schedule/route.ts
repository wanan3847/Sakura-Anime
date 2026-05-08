import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const schedules = await db.schedule.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
    });

    // 按星期分组
    const grouped: Record<number, typeof schedules> = {};
    for (let i = 0; i <= 6; i++) grouped[i] = [];
    for (const s of schedules) {
      if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = [];
      grouped[s.dayOfWeek].push(s);
    }

    return NextResponse.json(grouped);
  } catch {
    return NextResponse.json({ error: "获取排期失败" }, { status: 500 });
  }
}
