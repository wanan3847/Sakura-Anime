# 🌸 Sakura Anime

在线动漫流媒体平台，聚合多个 CMS 源，支持弹幕互动、收藏、观看历史、管理员排期。

## 功能

- **动漫浏览** — 首页轮播推荐、分类筛选、搜索、排行榜、周番表
- **视频播放** — HLS 自适应播放、多线路切换、弹幕发送、自动源切换
- **用户系统** — 注册登录、收藏夹、观看历史
- **管理后台** — 仪表盘统计、视频源管理、用户管理、弹幕管理、排期管理

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16.2.4 (App Router, Turbopack) |
| 前端 | React 19, Tailwind CSS v4, Lucide Icons |
| 数据库 | Prisma + SQLite |
| 认证 | NextAuth v5 (Credentials, JWT) |
| 播放器 | DPlayer + HLS.js |
| 数据源 | CMS 采集标准接口（bfzyapi 等） |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 CMS API 地址

# 初始化数据库
npx prisma db push
npx tsx prisma/seed.ts

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

管理员后台: http://localhost:3000/admin
默认管理员: `admin@sakura-anime.com` / `admin123456`

## 项目结构

```
src/
├── app/
│   ├── (main)/          # 用户页面
│   │   ├── page.tsx     # 首页
│   │   ├── anime/       # 动漫详情、播放
│   │   ├── category/    # 分类浏览
│   │   ├── search/      # 搜索
│   │   ├── ranking/     # 排行榜
│   │   ├── schedule/    # 周番表
│   │   └── user/        # 个人中心（收藏、历史、资料）
│   ├── admin/           # 管理后台
│   └── api/             # API 路由
├── components/          # UI 组件
├── lib/                 # 工具库（api, auth, db, utils）
└── generated/           # Prisma 生成的客户端
prisma/
├── schema.prisma        # 数据库模型
└── seed.ts              # 管理员初始化脚本
```

## 视频源

平台通过 CMS 采集标准接口聚合多个视频源，播放时自动中文化显示：

| 源ID | 显示名 |
|------|--------|
| bfzym3u8 | 暴风 |
| 1080zyk | 精品 |
| tkm3u8 | 西瓜 |
| ffm3u8 | 非凡 |
| wjm3u8 | 无尽 |
| hnm3u8 | 红牛 |
| jsm3u8 | 计算云 |
| fcm3u8 | 凤雏云 |

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | SQLite 数据库路径 |
| `NEXTAUTH_SECRET` | NextAuth 密钥 |
| `NEXTAUTH_URL` | 站点 URL |
| `ANIME_API_URL` | 主 CMS API 地址 |
| `ANIME_API_BACKUP_URL` | 备用 CMS API |
| `ANIME_API_WUJIN_URL` | 额外源 API |
| `ANIME_API_LZI_URL` | 量子源 API |
