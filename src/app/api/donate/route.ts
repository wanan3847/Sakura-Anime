import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const images = await db.donationImage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const role = (session.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "仅管理员可操作" }, { status: 403 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "用户ID不存在" }, { status: 400 });
    }

    const body = await request.json();
    const { image, caption } = body;

    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "无效的图片数据" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = image.match(/data:image\/(\w+);/)?.[1] || "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "images", "donate");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/images/donate/${filename}`;
    const saved = await db.donationImage.create({
      data: { userId, url, caption: caption || null },
    });

    return NextResponse.json({ image: saved });
  } catch (e) {
    console.error("上传失败:", e);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const role = (session.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "仅管理员可操作" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少id" }, { status: 400 });
    }

    const image = await db.donationImage.findUnique({ where: { id } });
    if (image) {
      // 删除文件
      const filePath = path.join(process.cwd(), "public", image.url);
      await unlink(filePath).catch(() => {});
      await db.donationImage.delete({ where: { id } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("删除失败:", e);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
