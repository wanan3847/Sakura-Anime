import { NextResponse } from "next/server";
import { db, fetchAnimePoster } from "@/lib/db";

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

    // 自动补全缺失的海报图片（异步，不阻塞响应）
    const missingPic = schedules.filter((s) => !s.animePic);
    if (missingPic.length > 0) {
      // Fire and forget - don't await
      Promise.all(
        missingPic.map(async (s) => {
          try {
            const pic = await fetchAnimePoster(s.animeName);
            if (pic) {
              await db.schedule.update({
                where: { id: s.id },
                data: { animePic: pic },
              });
              // Also update the grouped response
              const group = grouped[s.dayOfWeek];
              const item = group?.find((g) => g.id === s.id);
              if (item) item.animePic = pic;
            }
          } catch {}
        })
      ).catch(() => {});
    }

    return NextResponse.json(grouped);
  } catch {
    return NextResponse.json({ error: "获取排期失败" }, { status: 500 });
  }
}
