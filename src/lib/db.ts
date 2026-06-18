import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// 根据动漫名称查找海报图（从本地 catalog）
export async function fetchAnimePoster(name: string): Promise<string | null> {
  try {
    const item = await db.animeCatalog.findFirst({
      where: { name: { contains: name } },
      orderBy: { updatedAt: "desc" },
    });
    return item?.cover || null;
  } catch {
    return null;
  }
}
