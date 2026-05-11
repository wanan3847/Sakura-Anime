# Sakura Anime - 樱花动漫

在线动漫流媒体平台，聚合多个 CMS 采集源，支持弹幕互动、多线路切换、收藏历史、管理员排期。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16.2.4 (App Router, Turbopack) + React 19 |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS v4（亮色樱花粉主题） |
| 数据库 | Prisma + SQLite (LibSQL) |
| 认证 | NextAuth v5 (beta.31) — Credentials + JWT |
| 播放器 | DPlayer + HLS.js |
| 图标 | Lucide React |

## 功能特性

### 用户端

- **首页** — 轮播推荐 + 今日番剧侧栏 + 完整 7 天周番表 + 热门推荐 + 最近更新
- **目录浏览** — 四维筛选（类型/年份/状态/排序），封面卡片网格，评分角标
- **排行榜** — 按播放量、更新时间、评分三个维度排行
- **周番表** — 7 天排期，封面缩略图 + 播出时间，今日高亮
- **搜索** — 关键词搜索动漫
- **详情页** — 封面、评分、导演、演员、简介、多线路剧集列表
- **播放页** — HLS 自适应播放 + 多源自动切换 + 弹幕发送 + 收藏
- **用户中心** — 登录注册、收藏夹、观看历史（含播放进度）
- **赞赏** — 管理员上传二维码/感谢图片，用户端只读展示

### 管理后台

- **仪表盘** — 用户/动漫/弹幕/排期统计数据
- **视频源管理** — 添加/编辑/删除 CMS 采集源
- **用户管理** — 查看/编辑/删除用户
- **弹幕管理** — 审核/删除弹幕
- **排期管理** — 搜索动漫并安排到每周某天某时段
- **赞赏管理** — 上传/删除赞赏图片

### 技术亮点

- **多源聚合** — 同时对接 5+ 个 CMS 采集站，自动合并播放线路，主源失败自动切换备用源
- **视频代理** — 通过 `/api/proxy` 代理 HLS 请求，添加 Referer 头绕过 CDN 限制，M3U8 内链自动重写
- **弹幕系统** — DPlayer 弹幕集成，实时发送 + 数据库持久化
- **响应式布局** — 桌面端双栏（轮播+侧栏），移动端自适应单列，管理后台侧边栏可折叠

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装

```bash
npm install
```

### 环境变量

创建 `.env` 文件：

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# CMS 采集源（至少配置一个）
ANIME_API_URL="https://bfzyapi.com/api.php/provide/vod/"
ANIME_API_BACKUP_URL="https://api.zuidapi.com/api.php/provide/vod/"
ANIME_API_WUJIN_URL="https://api.wujinapi.me/api.php/provide/vod/"
ANIME_API_LZI_URL="https://cj.lziapi.com/api.php/provide/vod/"
ANIME_API_FFZY_URL="https://api.ffzyapi.com/api.php/provide/vod/"

# 管理员账号
ADMIN_EMAIL="admin@sakura-anime.com"
ADMIN_PASSWORD="admin123456"
```

### 初始化数据库

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000
管理后台: http://localhost:3000/admin
默认管理员: `admin@sakura-anime.com` / `admin123456`

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/
│   ├── (main)/              # 用户页面
│   │   ├── page.tsx         # 首页（轮播+周番表+推荐）
│   │   ├── category/        # 目录浏览（多维筛选）
│   │   ├── ranking/         # 排行榜
│   │   ├── schedule/        # 周番表
│   │   ├── search/          # 搜索
│   │   ├── donate/          # 赞赏
│   │   ├── anime/
│   │   │   ├── [id]/        # 动漫详情
│   │   │   └── play/[id]/   # 视频播放
│   │   └── user/
│   │       ├── profile/     # 个人中心
│   │       ├── favorites/   # 收藏夹
│   │       └── history/     # 观看历史
│   ├── admin/               # 管理后台
│   │   ├── page.tsx         # 仪表盘
│   │   ├── sources/         # 视频源管理
│   │   ├── users/           # 用户管理
│   │   ├── danmaku/         # 弹幕管理
│   │   ├── schedule/        # 排期管理
│   │   └── donate/          # 赞赏管理
│   └── api/                 # API 路由（16 个端点）
│       ├── anime/           # 动漫列表 + 详情
│       ├── auth/            # 认证（登录/注册）
│       ├── danmaku/         # 弹幕 CRUD
│       ├── donate/          # 赞赏图片
│       ├── favorites/       # 收藏
│       ├── history/         # 历史记录
│       ├── proxy/           # HLS 视频代理
│       ├── schedule/        # 周番表
│       ├── search/          # 搜索
│       └── admin/           # 管理后台 API（5 个）
├── components/
│   ├── anime/               # AnimeCard, AnimeGrid, AnimeSlider, EpisodeList, VideoPlayer
│   ├── common/              # Loading, Pagination
│   ├── layout/              # Header, Footer
│   └── providers/           # SessionProvider
├── lib/
│   ├── api.ts               # CMS 聚合模块（多源合并、缓存、源名中文化）
│   ├── auth.ts              # NextAuth 配置
│   ├── db.ts                # Prisma 客户端
│   └── utils.ts             # 工具函数
└── types/                   # DPlayer 类型声明

prisma/
├── schema.prisma            # 7 个数据模型
├── seed.ts                  # 种子数据（管理员 + 默认视频源）
└── dev.db                   # SQLite 数据库
```

## 数据模型

| 模型 | 说明 |
|------|------|
| User | 用户（邮箱/密码/角色） |
| Favorite | 收藏（用户+动漫唯一） |
| History | 观看历史（含播放进度） |
| Danmaku | 弹幕（时间/颜色/类型/用户） |
| VideoSource | 视频源配置（URL/优先级/启用状态） |
| Schedule | 周番表排期（星期/时段） |
| DonationImage | 赞赏图片 |

## CMS 源说明

兼容 CMS 采集站标准接口 `/api.php/provide/vod/`：

| 参数 | 说明 | 示例 |
|------|------|------|
| `ac` | 接口类型 | `list` / `detail` |
| `t` | 类型 ID | `41`（日韩动漫）、`40`（国产）、`39`（电影） |
| `pg` | 页码 | `1` |
| `pagesize` | 每页数量 | `24` |
| `sort` | 排序 | `time`、`hits`、`score` |
| `wd` | 搜索关键词 | `进击的巨人` |
| `ids` | 详情 ID | `140283` |

播放源名称自动中文化映射：

| 源 ID | 显示名 |
|--------|--------|
| bfzym3u8 | 暴风 |
| zuidam3u8 | 最大 |
| wjm3u8 | 无尽 |
| lzm3u8 | 量子 |
| ffm3u8 | 非凡 |
| ffzyapi | 非凡资源 |
| 1080zyk | 精品 |
| tkm3u8 | 西瓜 |
| hnm3u8 | 红牛 |
| jsm3u8 | 计算云 |
| fcm3u8 | 凤雏云 |

## 常用命令

```bash
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npx tsc --noEmit         # TypeScript 类型检查
npx prisma db push       # 同步数据库 schema
npx tsx prisma/seed.ts   # 初始化管理员 + 默认视频源
```

## 许可

MIT
