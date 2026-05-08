@AGENTS.md

## 项目概述
Sakura Anime — 在线动漫流媒体平台，聚合多个 CMS 源，支持弹幕、收藏、历史、管理员排期。

## 技术栈
- Next.js 16.2.4 (Turbopack) + React 19 + TypeScript
- Prisma + SQLite (`prisma/dev.db`)
- NextAuth v5 (beta.31) — Credentials, JWT
- Tailwind CSS v4 — 亮色樱花粉主题
- DPlayer + HLS.js — 视频播放

## 关键路径
| 路径 | 说明 |
|------|------|
| `src/app/(main)/` | 用户页面（首页、详情、播放、分类、搜索、排行榜、周番表、用户中心） |
| `src/app/admin/` | 管理后台（仪表盘、视频源、用户、弹幕、排期） |
| `src/app/api/` | API 路由（anime, auth, admin/*, favorites, history, danmaku, schedule, proxy, search） |
| `src/lib/api.ts` | CMS 聚合模块（fetchAPI, getAnimeList, getAnimeDetail, parsePlaySources） |
| `src/lib/auth.ts` | NextAuth 配置 |
| `src/lib/db.ts` | Prisma 客户端 |
| `src/components/` | UI 组件（anime/*, layout/*, common/*） |
| `prisma/schema.prisma` | 数据库模型（User, Favorite, History, Danmaku, VideoSource, Schedule） |

## 环境变量（.env）
- `ANIME_API_URL` / `ANIME_API_BACKUP_URL` / `ANIME_API_WUJIN_URL` / `ANIME_API_LZI_URL` — CMS 源
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — 认证
- `DATABASE_URL` — SQLite 路径

## 注意事项
- CMS `ac=list` 接口不返回 `vod_pic`，需要 `ac=detail` 获取封面图
- 视频播放必须通过 `/api/proxy` 代理（CDN 需要 Referer 头）
- 播放页有自动源切换逻辑（一个 CDN 失败自动尝试下一个）
- 亮色主题，不要暗色模式
- 视频源名称已中文化映射（暴风、精品、西瓜、非凡、无尽、红牛、计算云、凤雏云等）

## 常用命令
```bash
npm run dev          # 启动开发服务器
npx tsc --noEmit     # TypeScript 检查
npx prisma db push   # 同步数据库
npx tsx prisma/seed.ts  # 初始化管理员账号
```
