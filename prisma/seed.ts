import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // 1. 创建管理员
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sakura-anime.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  const existing = await db.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Admin user (${adminEmail}) already exists, skipping.`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "管理员",
        role: "admin",
      },
    });
    console.log(`Admin user created: ${admin.email} (id: ${admin.id})`);
  }

  // 2. 初始化默认视频源
  const defaultSources = [
    { name: "bfzyapi", apiUrl: process.env.ANIME_API_URL || "https://bfzyapi.com/api.php/provide/vod/", isActive: true, priority: 10, typeId: 41 },
    { name: "zuidapi", apiUrl: process.env.ANIME_API_BACKUP_URL || "https://api.zuidapi.com/api.php/provide/vod/", isActive: true, priority: 8, typeId: 30 },
    { name: "wujin", apiUrl: process.env.ANIME_API_WUJIN_URL || "https://api.wujinapi.me/api.php/provide/vod/", isActive: true, priority: 6, typeId: 30 },
    { name: "lzi", apiUrl: process.env.ANIME_API_LZI_URL || "https://cj.lziapi.com/api.php/provide/vod/", isActive: true, priority: 4, typeId: 30 },
    { name: "ffzyapi", apiUrl: process.env.ANIME_API_FFZY_URL || "https://api.ffzyapi.com/api.php/provide/vod/", isActive: true, priority: 3, typeId: 30 },
  ];

  const sourceCount = await db.videoSource.count();
  if (sourceCount === 0) {
    for (const src of defaultSources) {
      await db.videoSource.create({ data: src });
      console.log(`Video source created: ${src.name}`);
    }
  } else {
    console.log(`VideoSource already has ${sourceCount} records, skipping seed.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
