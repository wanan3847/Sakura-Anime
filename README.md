# Sakura Anime - 樱花动漫

在线动漫流媒体平台，聚合 5 个 CMS 采集源，支持多线路自动切换、剧集评论、收藏历史、管理员排期、按季筛选目录。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16.2.4 (App Router, Webpack) + React 19 |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS v4（亮色樱花粉主题） |
| 数据库 | Prisma + SQLite (LibSQL) |
| 认证 | NextAuth v5 (beta.31) — Credentials + JWT |
| 播放器 | DPlayer + HLS.js |
| 图标 | Lucide React |

## 功能特性

### 用户端

- **首页** — 轮播推荐 + 今日番剧 + 最近更新（每日自动同步）
- **目录浏览** — 按年份+季度筛选（1月/4月/7月/10月番），搜索，评分排序
- **排行榜** — 按评分、更新时间排行
- **周番表** — 7 天排期，封面缩略图 + 播出时间，今日高亮
- **搜索** — 关键词搜索动漫
- **详情页** — 封面、评分、简介、多线路剧集列表
- **播放页** — HLS 自适应播放 + 多源自动切换 + 每集评论区 + 收藏
- **反馈** — 用户提交 Bug 反馈，管理员可在后台回复，用户收到通知
- **用户中心** — 登录注册、收藏夹、观看历史、通知公告
- **赞赏** — 管理员上传二维码/感谢图片，左右两列展示

### 管理后台

- **仪表盘** — 用户/动漫/评论/排期统计数据
- **视频源管理** — 添加/编辑/删除 CMS 采集源
- **用户管理** — 查看/编辑/删除用户
- **Bug 反馈管理** — 查看用户反馈、回复用户、标记已处理
- **公告管理** — 创建全站公告或私信特定用户
- **排期管理** — 按年份+季度从本地目录选番，快捷同步 CMS 最新数据
- **轮播管理** — 从目录搜索导入 + 自选图片上传
- **评论管理** — 查看/删除所有评论
- **赞赏管理** — 上传/删除赞赏图片

### 技术亮点

- **多源聚合** — 同时对接 5 个 CMS 采集站（bfzy/ffzy/zuidapi/wujin/lzi），并发搜索所有源，自动合并播放线路去重
- **播放容错** — 主源失败自动切换到备用源，横向切换播放线路
- **本地目录** — 爬虫定时采集元数据到本地 SQLite，支持按年份+季度筛选，不依赖 CMS API 实时响应
- **自动同步** — 每日凌晨 5 点自动爬取最新数据，管理员也可手动一键同步
- **图片上传** — 轮播图支持本地上传，不再是单纯的 CMS 封面裁剪
- **剧集评论** — 每集独立评论区，支持回复
- **Bug 反馈** — 用户提交反馈，管理员后台回复，实时通知用户
- **公告系统** — 全站公告或私信特定用户，弹窗+铃铛通知
- **目录去重** — SQL 层 `row_number() PARTITION BY name` 保证同名动漫不重复
- **视频代理** — 通过 `/api/proxy` 代理 HLS 请求，添加 Referer 头绕过 CDN 限制
- **响应式布局** — 桌面端自适应多列，移动端单列

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
NEXTAUTH_URL="http://localhost:3001"

# CMS 采集源（至少配置一个）
ANIME_API_URL="https://bfzyapi.com/api.php/provide/vod/"
ANIME_API_BACKUP_URL="https://api.zuidapi.com/api.php/provide/vod/"
ANIME_API_WUJIN_URL="https://api.wujinapi.me/api.php/provide/vod/"
ANIME_API_LZI_URL="https://cj.lziapi.com/api.php/provide/vod/"
ANIME_API_FFZY_URL="https://api.ffzyapi.com/api.php/provide/vod/"

# 管理员账号
ADMIN_EMAIL="admin@sakura-anime.com"
ADMIN_PASSWORD="admin123456"

# 爬虫 API key（用于免登录触发数据同步，部署后请修改）
CRAWL_API_KEY="crawl-sakura-2026"
```

### 初始化数据库

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 启动开发服务器

```bash
# macOS Apple Silicon 需用 webpack（Turbopack 不支持 arm64）
npm run dev -- --webpack
# 或直接 npm run dev（如果配置了默认）
```

访问 http://localhost:3001
管理后台: http://localhost:3001/admin
默认管理员: `admin@sakura-anime.com` / `admin123456`

### 初始化/同步数据库

```bash
npx prisma db push        # 同步 schema 到数据库
# 爬取日本动漫数据（首次需要）
curl -X POST http://localhost:3001/api/admin/crawl \
  -H "Content-Type: application/json" \
  -d '{"key":"$CRAWL_API_KEY"}'
```

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
│   │   ├── ranking/         # 排行榜（评分/更新）
│   │   ├── schedule/        # 周番表
│   │   ├── search/          # 搜索
│   │   ├── feedback/        # 反馈提交
│   │   ├── donate/          # 赞赏（左右两列二维码）
│   │   ├── anime/
│   │   │   ├── [id]/        # 动漫详情
│   │   │   └── play/[id]/   # 视频播放（多源+每集评论）
│   │   └── user/
│   │       ├── profile/     # 个人中心
│   │       ├── favorites/   # 收藏夹
│   │       └── history/     # 观看历史
│   ├── admin/               # 管理后台
│   │   ├── page.tsx         # 仪表盘
│   │   ├── sources/         # 视频源管理
│   │   ├── users/           # 用户管理
│   │   ├── bug-reports/     # Bug 反馈管理
│   │   ├── notifications/   # 公告管理
│   │   ├── comments/        # 评论管理
│   │   ├── carousel/        # 轮播管理（含图片上传）
│   │   ├── schedule/        # 排期管理（按季选番+同步按钮+一键清空）
│   │   └── donate/          # 赞赏管理
│   └── api/                 # API 路由
│       ├── anime/           # 动漫列表 + 详情（多源聚合）
│       ├── catalog/         # 本地目录查询（年份/季度/搜索/分页）
│       ├── upload/          # 图片上传
│       ├── auth/            # 认证（登录/注册）
│       ├── comments/        # 评论（支持每集评论）
│       ├── donate/          # 赞赏图片
│       ├── carousel/        # 轮播 CRUD
│       ├── favorites/       # 收藏
│       ├── history/         # 历史记录
│       ├── proxy/           # HLS 视频代理
│       ├── schedule/        # 周番表
│       ├── search/          # 搜索
│       └── admin/           # 管理后台 API（crawl/carousel/schedule/stats 等）
├── components/
│   ├── anime/               # VideoPlayer, EpisodeList, EpisodeCommentSection, AnimeCard, AnimeGrid, AnimeSlider
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
├── schema.prisma            # 9 个数据模型
├── seed.ts                  # 种子数据（管理员 + 默认视频源）
└── dev.db                   # SQLite 数据库
```

## 数据模型

| 模型 | 说明 |
|------|------|
| User | 用户（邮箱/密码/角色） |
| AnimeCatalog | 本地动漫目录（id/name/cover/year/area/type/score/vodTime/sourceId） |
| Favorite | 收藏（用户+动漫唯一） |
| History | 观看历史（含播放进度） |
| Comment | 评论/回复（支持每集评论 episodeId，支持回复 parentId） |
| Notification | 通知/公告（userId=null 全站，有值=私信，支持 bug_reply/announcement 类型） |
| Schedule | 周番表排期（星期/时段/animeId） |
| Carousel | 轮播图（title/imageUrl/linkUrl/badge/order/isActive） |
| VideoSource | 视频源配置（URL/优先级/启用状态） |
| DonationImage | 赞赏图片 |

## CMS 源说明

兼容 CMS 采集站标准接口 `/api.php/provide/vod/`：

| 参数 | 说明 | 示例 |
|------|------|------|
| `ac` | 接口类型 | `list` / `detail` |
| `t` | 类型 ID | `41`（bfzy 日本）、`30`（ffzy/zuidapi/lzi 日本） |
| `pg` | 页码 | `1` |
| `pagesize` | 每页数量 | `24` |
| `by` | 排序（注意不是 sort） | `time`、`hits`、`score` |
| `wd` | 搜索关键词 | `进击的巨人` |
| `ids` | 详情 ID | `140283` |

> **注意**：CMS 标准用 `by=` 参数排序，不是 `sort=`。使用错误的参数名会导致排序失效。

### 视频源管理

视频源从数据库 `VideoSource` 表动态读取，不在代码中硬编码。管理员可在后台 `/admin/sources` 管理：

| 字段 | 说明 |
|------|------|
| `name` | 源标识（如 bfzyapi），用于 ID 前缀路由 |
| `apiUrl` | CMS API 地址 |
| `typeId` | 日本动漫类型 ID（bfzy=41，其他如 ffzy/zuidapi/lzi=30） |
| `isActive` | 启用/禁用 |
| `priority` | 优先级（越高越优先） |

修改源后最多 1 分钟生效（60 秒缓存）。

### 当前已配置的源

| 源 | 类型ID(日本) | API 地址 |
|----|-------------|----------|
| bfzyapi | 41 | `https://bfzyapi.com/api.php/provide/vod/` |
| ffzyapi | 30 | `https://cj.ffzyapi.com/api.php/provide/vod/` |
| zuidapi | 30 | `https://api.zuidapi.com/api.php/provide/vod/` |
| wujin | 30 | `https://api.wujinapi.me/api.php/provide/vod/` |
| lzi | 30 | `https://cj.lziapi.com/api.php/provide/vod/` |

播放时 5 个源并发查询，用名称搜索非主源，合并所有播放线路去重。

### 播放源名称映射

| 源 ID | 显示名 |
|--------|--------|
| bfzym3u8 | 暴风 |
| zuidam3u8 | 最大 |
| wjm3u8 | 无尽 |
| lzm3u8 | 量子 |
| ffm3u8 | 非凡资源 |
| ffzyapi | 非凡资源 |
| 1080zyk | 精品 |
| tkm3u8 | 西瓜 |
| hnm3u8 | 红牛 |
| jsm3u8 | 计算云 |
| fcm3u8 | 凤雏云 |
| feifan | ❌ 已失效，播放页自动过滤 |

> 已知失效源（feifan/非凡）已在播放页自动过滤，不出现在源选择列表中。

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
